import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Save, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/PasswordInput";
import { fieldCls } from "@/components/ui-bits";
import { listAccounts, saveAccount, createAccount } from "@/lib/admin-users.functions";

type Role = "customer" | "operator" | "admin";
type Account = { id: string; email: string; full_name: string; phone: string; nuit: string; roles: Role[]; confirmed: boolean };
type Edit = { id?: string; email: string; full_name: string; phone: string; nuit: string; roles: Role[]; password: string; confirm: string };
const labels: Record<Role, string> = { customer: "Cliente", operator: "Operador", admin: "Administrador" };
const empty: Edit = { email: "", full_name: "", phone: "", nuit: "", roles: ["customer"], password: "", confirm: "" };

export function UsersAdmin({ onSaved }: { onSaved: () => void }) {
  const fetchAccounts = useServerFn(listAccounts);
  const create = useServerFn(createAccount);
  const save = useServerFn(saveAccount);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [editing, setEditing] = useState<Edit | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setLoading(true);
    try { setAccounts(await fetchAccounts()); } catch { setMsg("Não foi possível carregar as contas. Tente novamente."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (!editing.roles.length) return setMsg("Escolha pelo menos um perfil de acesso.");
    if (!editing.id && editing.password !== editing.confirm) return setMsg("As palavras-passe não coincidem.");
    setBusy(true); setMsg("");
    try {
      const fields = { full_name: editing.full_name, phone: editing.phone, nuit: editing.nuit, roles: editing.roles };
      if (editing.id) await save({ data: { ...fields, id: editing.id } });
      else await create({ data: { ...fields, email: editing.email, password: editing.password, redirectTo: window.location.origin } });
      setMsg(editing.id ? "Perfil e permissões guardados." : "Conta criada. Foi enviado um convite de confirmação por email.");
      setEditing(null); await load(); onSaved();
    } catch (error) { setMsg(error instanceof Error ? error.message : "Não foi possível guardar a conta."); }
    finally { setBusy(false); }
  };
  const filtered = accounts.filter((a) => (role === "all" || a.roles.includes(role as Role)) && `${a.full_name} ${a.email} ${a.phone}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="mt-5 space-y-4">
    <div className="flex flex-wrap items-center gap-3"><Button onClick={() => { setEditing({ ...empty }); setMsg(""); }}><Plus /> Novo utilizador</Button><Button variant="outline" onClick={() => { setEditing({ ...empty, roles: ["operator"] }); setMsg(""); }}><Plus /> Novo operador</Button></div>
    {msg && <p role="status" className="text-sm text-primary">{msg}</p>}
    {editing && <form onSubmit={submit} className="grid gap-4 border-y border-border py-5 sm:grid-cols-2">
      <h2 className="font-display text-2xl sm:col-span-2">{editing.id ? "Editar perfil" : "Criar utilizador"}</h2>
      <label className="text-sm">Nome completo<input required className={fieldCls} value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></label>
      <label className="text-sm">Email<input required={!editing.id} disabled={Boolean(editing.id)} type="email" className={fieldCls} value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></label>
      <label className="text-sm">Telefone<input type="tel" className={fieldCls} value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></label>
      <label className="text-sm">NUIT<input className={fieldCls} value={editing.nuit} onChange={(e) => setEditing({ ...editing, nuit: e.target.value })} /></label>
      {!editing.id && <><label className="text-sm">Palavra-passe<PasswordInput required minLength={8} autoComplete="new-password" value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} /></label><label className="text-sm">Confirmar palavra-passe<PasswordInput required minLength={8} autoComplete="new-password" value={editing.confirm} onChange={(e) => setEditing({ ...editing, confirm: e.target.value })} /></label></>}
      <fieldset className="sm:col-span-2"><legend className="mb-2 text-sm font-semibold">Permissões</legend><div className="flex flex-wrap gap-5">{(["customer", "operator", "admin"] as const).map((r) => <label key={r} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.roles.includes(r)} onChange={(e) => setEditing({ ...editing, roles: e.target.checked ? [...editing.roles, r] : editing.roles.filter((v) => v !== r) })} />{labels[r]}</label>)}</div></fieldset>
      <div className="flex gap-2 sm:col-span-2"><Button disabled={busy} type="submit"><Save />{busy ? "A guardar…" : "Guardar"}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setEditing(null)}><X /> Cancelar</Button></div>
    </form>}
    <div className="flex flex-wrap gap-3"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-input px-3"><Search className="h-4 w-4 shrink-0 text-muted-foreground" /><input aria-label="Pesquisar utilizadores" placeholder="Nome, email ou telefone" className="min-w-0 flex-1 bg-transparent text-sm outline-none" value={query} onChange={(e) => setQuery(e.target.value)} /></label><select aria-label="Filtrar permissões" className={`${fieldCls} w-auto`} value={role} onChange={(e) => setRole(e.target.value)}><option value="all">Todos os perfis</option>{Object.entries(labels).map(([r, label]) => <option key={r} value={r}>{label}</option>)}</select></div>
    {loading ? <p className="py-6 text-sm text-muted-foreground">A carregar utilizadores…</p> : <div className="divide-y divide-border">{filtered.length === 0 && <p className="py-6 text-sm text-muted-foreground">Nenhum utilizador encontrado.</p>}{filtered.map((a) => <div key={a.id} className="flex items-center gap-3 py-4"><div className="min-w-0 flex-1"><strong className="block text-sm">{a.full_name || "Sem nome"}</strong><span className="block break-all text-sm text-muted-foreground">{a.email || a.phone}</span><span className="text-xs text-muted-foreground">{a.roles.map((r) => labels[r]).join(" · ") || "Sem permissões"}{!a.confirmed && " · Confirmação pendente"}</span></div><Button size="icon" variant="outline" aria-label={`Editar perfil de ${a.full_name || a.email}`} title="Editar perfil" onClick={() => { setEditing({ ...a, password: "", confirm: "" }); setMsg(""); }}><Pencil /></Button></div>)}</div>}
  </section>;
}