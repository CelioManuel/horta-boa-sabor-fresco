import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, ShieldAlert, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fieldCls } from "@/components/ui-bits";
import { DELETE_CONFIRM_WORD } from "@/lib/account-deletion";
import { listDeletionRequests, requestAccountDeletion, reviewDeletionRequest } from "@/lib/account-deletion.functions";

type Req = { id: string; status: string; created_at: string };

export function DeleteAccountSection({ uid }: { uid: string }) {
  const send = useServerFn(requestAccountDeletion);
  const [pending, setPending] = useState<Req | null>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const { data } = await supabase.from("account_deletion_requests").select("id,status,created_at").eq("user_id", uid).eq("status", "pending").maybeSingle();
    setPending(data);
  };
  useEffect(() => { void load(); }, [uid]);
  const submit = async () => {
    setBusy(true); setMsg("");
    try { await send({ data: { reason, confirm } }); setOpen(false); setReason(""); setConfirm(""); await load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Não foi possível enviar o pedido."); }
    finally { setBusy(false); }
  };
  const cancel = async () => {
    if (!pending) return;
    await supabase.from("account_deletion_requests").update({ status: "cancelled" }).eq("id", pending.id);
    await load();
  };
  return <section className="mt-4 rounded-lg border border-destructive/40 bg-card p-5">
    <h2 className="flex items-center gap-2 font-display text-xl text-destructive"><ShieldAlert className="h-5 w-5" /> Eliminar conta</h2>
    {pending ? <>
      <p className="mt-2 text-sm">O seu pedido de eliminação de {new Date(pending.created_at).toLocaleDateString("pt-MZ")} aguarda a aprovação do administrador.</p>
      <Button className="mt-3" variant="outline" onClick={() => void cancel()}><X /> Cancelar pedido</Button>
    </> : !open ? <>
      <p className="mt-1 text-sm text-muted-foreground">O pedido é analisado por um administrador. Após aprovação perde o perfil, endereços e acesso à conta. Não é possível com encomendas em curso.</p>
      <Button className="mt-3" variant="outline" onClick={() => setOpen(true)}><Trash2 /> Pedir eliminação da conta</Button>
    </> : <div className="mt-3 grid gap-3">
      <label className="text-sm">Motivo<textarea className={`${fieldCls} min-h-20`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} /></label>
      <label className="text-sm">Escreva <strong>{DELETE_CONFIRM_WORD}</strong> para confirmar<input className={fieldCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" /></label>
      {msg && <p role="alert" className="text-sm text-destructive">{msg}</p>}
      <div className="flex gap-2">
        <Button variant="destructive" disabled={busy || confirm.trim() !== DELETE_CONFIRM_WORD || reason.trim().length < 5} onClick={() => void submit()}><Trash2 /> {busy ? "A enviar…" : "Enviar pedido"}</Button>
        <Button variant="outline" onClick={() => { setOpen(false); setMsg(""); }}>Voltar</Button>
      </div>
    </div>}
  </section>;
}

type AdminReq = { id: string; reason: string; created_at: string; full_name: string; phone: string; total_orders: number; active_orders: number };

export function DeletionRequestsAdmin() {
  const list = useServerFn(listDeletionRequests);
  const review = useServerFn(reviewDeletionRequest);
  const [reqs, setReqs] = useState<AdminReq[]>([]);
  const [msg, setMsg] = useState("");
  const load = async () => { try { setReqs(await list()); } catch { setMsg("Não foi possível carregar os pedidos."); } };
  useEffect(() => { void load(); }, []);
  const act = async (r: AdminReq, approve: boolean) => {
    if (approve && !window.confirm(`Eliminar definitivamente a conta de ${r.full_name || r.phone}? Esta ação não pode ser desfeita.`)) return;
    const note = approve ? "" : (window.prompt("Motivo da rejeição (opcional)") ?? "");
    try { await review({ data: { id: r.id, approve, note } }); setMsg(approve ? "Conta eliminada." : "Pedido rejeitado."); await load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Erro."); }
  };
  return <section className="mt-5 space-y-3">
    {msg && <p role="status" className="text-sm text-primary">{msg}</p>}
    {reqs.length === 0 ? <p className="py-6 text-sm text-muted-foreground">Não há pedidos de eliminação pendentes.</p> : <div className="divide-y divide-border rounded-lg border border-border bg-card">{reqs.map((r) => <div key={r.id} className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1 text-sm">
        <strong className="block">{r.full_name || "Sem nome"}</strong>
        <span className="block text-muted-foreground">{r.phone} · pedido em {new Date(r.created_at).toLocaleDateString("pt-MZ")}</span>
        <span className="block">Motivo: {r.reason}</span>
        <span className={`block text-xs ${r.active_orders ? "text-destructive" : "text-muted-foreground"}`}>{r.total_orders} encomendas · {r.active_orders} em curso</span>
      </div>
      <Button size="sm" variant="destructive" disabled={r.active_orders > 0} onClick={() => void act(r, true)}><Check /> Aprovar e eliminar</Button>
      <Button size="sm" variant="outline" onClick={() => void act(r, false)}><X /> Rejeitar</Button>
    </div>)}</div>}
  </section>;
}
