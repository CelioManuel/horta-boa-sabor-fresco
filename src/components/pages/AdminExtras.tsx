import { useEffect, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fieldCls, mzn, paymentLabel, statusLabel } from "@/components/ui-bits";

type Ord = { id: string; status: string; total: number; payment_status: string; payment_method: string; created_at: string };

export function AdminDashboard() {
  const [orders, setOrders] = useState<Ord[]>([]);
  const [top, setTop] = useState<Array<[string, number, number]>>([]);
  const [days, setDays] = useState(30);
  useEffect(() => {
    const since = new Date(Date.now() - days * 864e5).toISOString();
    void supabase.from("orders").select("id,status,total,payment_status,payment_method,created_at").gte("created_at", since).limit(5000).then(async ({ data }) => {
      const list = (data ?? []).map((o) => ({ ...o, total: Number(o.total) })); setOrders(list);
      if (!list.length) return setTop([]);
      const { data: items } = await supabase.from("order_items").select("product_name,quantity,unit_price,order_id").in("order_id", list.filter((o) => o.status !== "cancelled").map((o) => o.id).slice(0, 500));
      const m = new Map<string, [number, number]>();
      for (const i of items ?? []) { const c = m.get(i.product_name) ?? [0, 0]; m.set(i.product_name, [c[0] + Number(i.quantity), c[1] + Number(i.quantity) * Number(i.unit_price)]); }
      setTop([...m.entries()].map(([n, [q, v]]) => [n, q, v] as [string, number, number]).sort((a, b) => b[2] - a[2]).slice(0, 10));
    });
  }, [days]);
  const valid = orders.filter((o) => o.status !== "cancelled");
  const revenue = valid.reduce((s, o) => s + o.total, 0);
  const paid = valid.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total, 0);
  const byStatus = Object.keys(statusLabel).map((k) => [statusLabel[k] ?? k, orders.filter((o) => o.status === k).length] as const);
  const byPay = Object.keys(paymentLabel).map((k) => [paymentLabel[k] ?? k, valid.filter((o) => o.payment_method === k).reduce((s, o) => s + o.total, 0)] as const);
  const exportCsv = () => {
    const rows = [["data", "estado", "pagamento", "metodo", "total"], ...orders.map((o) => [o.created_at, statusLabel[o.status], o.payment_status, paymentLabel[o.payment_method], String(o.total)])];
    const blob = new Blob([rows.map((r) => r.join(";")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `horta-boa-vendas-${days}d.csv`; a.click();
  };
  return <section className="mt-5 space-y-5">
    <div className="flex flex-wrap items-center gap-2">{[7, 30, 90, 365].map((d) => <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>{d === 365 ? "1 ano" : `${d} dias`}</Button>)}<Button size="sm" variant="ghost" onClick={exportCsv}>Exportar CSV</Button></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{([["Vendas", mzn(revenue)], ["Recebido", mzn(paid)], ["Encomendas", String(valid.length)], ["Ticket médio", mzn(valid.length ? Math.round(revenue / valid.length) : 0)]] as const).map(([l, v]) => <article key={l} className="rounded-lg border border-border bg-card p-4"><span className="text-xs text-muted-foreground">{l}</span><strong className="mt-1 block font-display text-2xl">{v}</strong></article>)}</div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Por estado">{byStatus.map(([l, v]) => <Bar key={l} label={l} value={v} max={Math.max(1, ...byStatus.map((x) => x[1]))} text={String(v)} />)}</Card>
      <Card title="Por pagamento">{byPay.map(([l, v]) => <Bar key={l} label={l} value={v} max={Math.max(1, ...byPay.map((x) => x[1]))} text={mzn(v)} />)}</Card>
      <Card title="Produtos mais vendidos">{top.length === 0 ? <p className="text-sm text-muted-foreground">Sem vendas neste período.</p> : top.map(([n, q, v]) => <Bar key={n} label={`${n} (${q})`} value={v} max={top[0]?.[2] ?? 1} text={mzn(v)} />)}</Card>
    </div>
  </section>;
}
const Card = ({ title, children }: { title: string; children: React.ReactNode }) => <div className="rounded-lg border border-border bg-card p-4"><h3 className="mb-3 font-display text-xl">{title}</h3><div className="space-y-2">{children}</div></div>;
const Bar = ({ label, value, max, text }: { label: string; value: number; max: number; text: string }) => <div><div className="flex justify-between gap-2 text-xs"><span className="truncate">{label}</span><strong>{text}</strong></div><div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(value / max) * 100}%` }} /></div></div>;

type StoreRow = { id?: string; name: string; address: string; phone: string; delivery_radius_km: number; delivery_fee: number; is_active: boolean };
const emptyStore: StoreRow = { name: "", address: "", phone: "", delivery_radius_km: 15, delivery_fee: 0, is_active: true };
export function StoresAdmin() {
  const [list, setList] = useState<StoreRow[]>([]);
  const [edit, setEdit] = useState<StoreRow | null>(null);
  const [msg, setMsg] = useState("");
  const load = () => void supabase.from("stores").select("id,name,address,phone,delivery_radius_km,delivery_fee,is_active").order("created_at").then(({ data }) => setList((data ?? []).map((s) => ({ ...s, delivery_radius_km: Number(s.delivery_radius_km), delivery_fee: Number(s.delivery_fee) }))));
  useEffect(load, []);
  const save = async () => { if (!edit?.name.trim()) return setMsg("Indique o nome."); const { id, ...fields } = edit; const row = { ...fields, delivery_fee: 0 }; const { error } = id ? await supabase.from("stores").update(row).eq("id", id) : await supabase.from("stores").insert(row); setMsg(error ? "Erro: " + error.message : "Loja guardada."); if (!error) { setEdit(null); load(); } };
  const del = async (s: StoreRow) => { if (!s.id || !confirm(`Remover ${s.name}?`)) return; const { error } = await supabase.from("stores").delete().eq("id", s.id); if (error) await supabase.from("stores").update({ is_active: false }).eq("id", s.id); load(); };
  return <section className="mt-5">
    <p className="mb-3 text-sm text-muted-foreground">As entregas são gratuitas em todas as lojas.</p>
    <Button onClick={() => setEdit({ ...emptyStore })}><Plus /> Nova loja</Button>
    {msg && <p className="mt-3 text-sm text-primary">{msg}</p>}
    {edit && <div className="mt-4 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
      <label className="text-sm">Nome<input className={fieldCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
      <label className="text-sm">Telefone<input className={fieldCls} value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></label>
      <label className="text-sm sm:col-span-2">Endereço<input className={fieldCls} value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} /></label>
      <label className="text-sm">Raio de entrega (km)<input type="number" className={fieldCls} value={edit.delivery_radius_km} onChange={(e) => setEdit({ ...edit, delivery_radius_km: Number(e.target.value) })} /></label>
      <label className="text-sm">Taxa de entrega (MZN)<input type="number" className={fieldCls} value={0} readOnly /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.is_active} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} /> Ativa</label>
      <div className="flex gap-2 sm:col-span-2"><Button onClick={() => void save()}><Save /> Guardar</Button><Button variant="outline" onClick={() => setEdit(null)}><X /> Cancelar</Button></div>
    </div>}
    <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">{list.map((s) => <div key={s.id} className="flex flex-wrap items-center gap-3 border-b border-border p-3 last:border-0"><div className="min-w-40 flex-1"><strong className="block text-sm">{s.name}{!s.is_active && <span className="ml-2 text-xs text-muted-foreground">(inativa)</span>}</strong><small className="text-muted-foreground">{s.address} · {s.delivery_radius_km} km · entrega gratuita</small></div><Button size="icon" variant="outline" aria-label="Editar" onClick={() => setEdit(s)}><Pencil /></Button><Button size="icon" variant="outline" aria-label="Remover" onClick={() => void del(s)}><Trash2 /></Button></div>)}</div>
  </section>;
}

type Promo = { id?: string; name: string; code: string; discount_percent: number; starts_at: string; ends_at: string; is_active: boolean };
const day = (d: Date) => d.toISOString().slice(0, 10);
export function PromotionsAdmin() {
  const [list, setList] = useState<Promo[]>([]);
  const [edit, setEdit] = useState<Promo | null>(null);
  const [msg, setMsg] = useState("");
  const load = () => void supabase.from("promotions").select("id,name,code,discount_percent,starts_at,ends_at,is_active").order("starts_at", { ascending: false }).then(({ data }) => setList((data ?? []).map((p) => ({ ...p, discount_percent: Number(p.discount_percent) }))));
  useEffect(load, []);
  const save = async () => {
    if (!edit?.name.trim() || !edit.code.trim()) return setMsg("Indique nome e código.");
    if (edit.discount_percent <= 0 || edit.discount_percent > 100) return setMsg("O desconto deve estar entre 1 e 100%.");
    const { id, ...r } = edit; const row = { ...r, code: r.code.trim().toUpperCase(), starts_at: new Date(r.starts_at.slice(0, 10) + "T00:00:00").toISOString(), ends_at: new Date(r.ends_at.slice(0, 10) + "T23:59:59").toISOString() };
    const { error } = id ? await supabase.from("promotions").update(row).eq("id", id) : await supabase.from("promotions").insert(row);
    setMsg(error ? "Erro: " + error.message : "Promoção guardada."); if (!error) { setEdit(null); load(); }
  };
  const del = async (p: Promo) => { if (!p.id || !confirm(`Remover ${p.name}?`)) return; await supabase.from("promotions").delete().eq("id", p.id); load(); };
  const now = Date.now();
  return <section className="mt-5">
    <Button onClick={() => setEdit({ name: "", code: "", discount_percent: 10, starts_at: day(new Date()), ends_at: day(new Date(now + 30 * 864e5)), is_active: true })}><Plus /> Nova promoção</Button>
    {msg && <p className="mt-3 text-sm text-primary">{msg}</p>}
    {edit && <div className="mt-4 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
      <label className="text-sm">Nome<input className={fieldCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
      <label className="text-sm">Código<input className={fieldCls} value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase() })} /></label>
      <label className="text-sm">Desconto (%)<input type="number" className={fieldCls} value={edit.discount_percent} onChange={(e) => setEdit({ ...edit, discount_percent: Number(e.target.value) })} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.is_active} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} /> Ativa</label>
      <label className="text-sm">Início<input type="date" className={fieldCls} value={edit.starts_at.slice(0, 10)} onChange={(e) => setEdit({ ...edit, starts_at: e.target.value })} /></label>
      <label className="text-sm">Fim<input type="date" className={fieldCls} value={edit.ends_at.slice(0, 10)} onChange={(e) => setEdit({ ...edit, ends_at: e.target.value })} /></label>
      <div className="flex gap-2 sm:col-span-2"><Button onClick={() => void save()}><Save /> Guardar</Button><Button variant="outline" onClick={() => setEdit(null)}><X /> Cancelar</Button></div>
    </div>}
    <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">{list.length === 0 && <p className="p-4 text-sm text-muted-foreground">Sem promoções.</p>}{list.map((p) => { const live = p.is_active && new Date(p.starts_at).getTime() <= now && new Date(p.ends_at).getTime() >= now; return <div key={p.id} className="flex flex-wrap items-center gap-3 border-b border-border p-3 last:border-0"><div className="min-w-40 flex-1"><strong className="block text-sm">{p.name} · <code>{p.code}</code> · {p.discount_percent}%</strong><small className="text-muted-foreground">{new Date(p.starts_at).toLocaleDateString("pt-MZ")} – {new Date(p.ends_at).toLocaleDateString("pt-MZ")}</small></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${live ? "bg-leaf-soft text-primary" : "bg-muted text-muted-foreground"}`}>{live ? "Em vigor" : "Inativa"}</span><Button size="icon" variant="outline" aria-label="Editar" onClick={() => setEdit(p)}><Pencil /></Button><Button size="icon" variant="outline" aria-label="Remover" onClick={() => void del(p)}><Trash2 /></Button></div>; })}</div>
  </section>;
}
