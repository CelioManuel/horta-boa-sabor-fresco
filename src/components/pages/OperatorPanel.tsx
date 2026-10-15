import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, MapPin, Package, Truck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Empty, Page, PageTitle, StatusTimeline, mzn, paymentLabel, statusFlow, statusLabel } from "@/components/ui-bits";

type O = { id: string; order_number: number; status: string; payment_status: string; payment_method: string; delivery_address: string; total: number; notes: string | null; created_at: string };
type Item = { order_id: string; product_name: string; unit_label: string; quantity: number };
type Stock = { product_id: string; name: string; unit_label: string; quantity: number; rowId?: string };

export function OperatorPanel({ isAdmin }: { isAdmin: boolean }) {
  const [tab, setTab] = useState<"active" | "done" | "stock">("active");
  const [uid, setUid] = useState<string | null>(null);
  const [orders, setOrders] = useState<O[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [stock, setStock] = useState<Stock[]>([]);
  const [msg, setMsg] = useState("");

  const load = async (id: string) => {
    let q = supabase.from("orders").select("id,order_number,status,payment_status,payment_method,delivery_address,total,notes,created_at").order("created_at", { ascending: false }).limit(200);
    if (!isAdmin) q = q.eq("operator_id", id);
    const { data } = await q;
    const list = (data ?? []).map((o) => ({ ...o, total: Number(o.total) }));
    setOrders(list);
    if (list.length) { const { data: it } = await supabase.from("order_items").select("order_id,product_name,unit_label,quantity").in("order_id", list.map((o) => o.id)); setItems((it ?? []).map((i) => ({ ...i, quantity: Number(i.quantity) }))); }
  };
  const loadStock = async (id: string) => {
    const [{ data: prods }, { data: rows }] = await Promise.all([supabase.from("products").select("id,name,unit_label").eq("is_active", true).order("name"), supabase.from("operator_stock").select("id,product_id,quantity").eq("operator_id", id)]);
    setStock((prods ?? []).map((p) => { const r = (rows ?? []).find((x) => x.product_id === p.id); return { product_id: p.id, name: p.name, unit_label: p.unit_label, quantity: Number(r?.quantity ?? 0), rowId: r?.id }; }));
  };
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => { const id = data.user?.id ?? null; setUid(id); if (id) { void load(id); void loadStock(id); } }); }, []);
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2500); };

  const advance = async (o: O) => {
    const i = statusFlow.indexOf(o.status as (typeof statusFlow)[number]);
    const next = statusFlow[i + 1]; if (!next) return;
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", o.id);
    flash(error ? "Erro: " + error.message : `#${o.order_number}: ${statusLabel[next]}`); if (uid) void load(uid);
  };
  const markPaid = async (o: O) => { const { error } = await supabase.from("orders").update({ payment_status: "paid" }).eq("id", o.id); flash(error ? "Erro: " + error.message : "Pagamento confirmado."); if (uid) void load(uid); };
  const saveStock = async (s: Stock, quantity: number) => {
    if (!uid) return; const q = Math.max(0, quantity);
    const { error } = s.rowId ? await supabase.from("operator_stock").update({ quantity: q, updated_at: new Date().toISOString() }).eq("id", s.rowId) : await supabase.from("operator_stock").insert({ operator_id: uid, product_id: s.product_id, quantity: q });
    if (error) flash("Erro: " + error.message); void loadStock(uid);
  };

  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const done = orders.filter((o) => o.status === "delivered" || o.status === "cancelled");
  const today = new Date().toDateString();
  const stats: Array<[string, number, typeof Package]> = [["Para preparar", orders.filter((o) => o.status === "received" || o.status === "preparing").length, Package], ["A caminho", orders.filter((o) => o.status === "on_the_way" || o.status === "almost_there").length, Truck], ["Entregues hoje", orders.filter((o) => o.status === "delivered" && new Date(o.created_at).toDateString() === today).length, Check], ["Por cobrar", orders.filter((o) => o.payment_status !== "paid" && o.status !== "cancelled").length, Wallet]];
  const list = tab === "active" ? active : done;

  return <Page wide>
    <PageTitle title="Painel do operador" subtitle={isAdmin ? "Vista de administrador: todas as encomendas." : "Prepare e entregue as encomendas atribuídas a si."} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([l, v, I]) => <article key={l} className="rounded-lg border border-border bg-card p-4"><I className="text-primary" /><strong className="mt-3 block font-display text-3xl">{v}</strong><span className="text-sm text-muted-foreground">{l}</span></article>)}</div>
    <div className="hide-scrollbar mt-6 flex gap-2 overflow-x-auto">{([["active", `Ativas (${active.length})`], ["done", `Concluídas (${done.length})`], ["stock", "O meu stock"]] as const).map(([k, l]) => <Button key={k} size="sm" variant={tab === k ? "default" : "outline"} onClick={() => setTab(k)}>{l}</Button>)}</div>
    {msg && <p className="mt-4 rounded-md bg-leaf-soft px-3 py-2 text-sm text-primary">{msg}</p>}
    {tab !== "stock" && <div className="mt-5 space-y-3">{list.length === 0 && <Empty title="Sem encomendas" text={tab === "active" ? "Não há encomendas por tratar neste momento." : "Ainda não há encomendas concluídas."} />}{list.map((o) => {
      const its = items.filter((i) => i.order_id === o.id); const next = statusFlow[statusFlow.indexOf(o.status as (typeof statusFlow)[number]) + 1];
      return <article key={o.id} className="rounded-lg border border-border bg-card p-4">
        <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen(open === o.id ? null : o.id)}><div><span className="text-xs text-muted-foreground">#{o.order_number} · {new Date(o.created_at).toLocaleString("pt-MZ")}</span><h3 className="font-display text-xl">{its.length} artigos · {mzn(o.total)}</h3><small className="text-muted-foreground"><MapPin className="mr-1 inline h-3.5 w-3.5" />{o.delivery_address}</small></div><span className="flex items-center gap-2"><span className="rounded-full bg-harvest/20 px-3 py-1 text-xs font-bold text-harvest-deep">{statusLabel[o.status]}</span>{open === o.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span></button>
        {open === o.id && <div className="mt-4 space-y-4 border-t border-border pt-4"><StatusTimeline status={o.status} /><ul className="space-y-1 text-sm">{its.map((i, k) => <li key={k}>{i.quantity} × {i.product_name} <small className="text-muted-foreground">({i.unit_label})</small></li>)}</ul>{o.notes && <p className="text-sm text-muted-foreground">Nota: {o.notes}</p>}<p className="text-sm">Pagamento: <strong>{paymentLabel[o.payment_method]}</strong> · {o.payment_status === "paid" ? "Pago" : "Pendente"}</p></div>}
        {o.status !== "cancelled" && <div className="mt-4 flex flex-wrap gap-2">{next && <Button size="sm" onClick={() => void advance(o)}><Check /> Passar a “{statusLabel[next]}”</Button>}{o.payment_status !== "paid" && <Button size="sm" variant="outline" onClick={() => void markPaid(o)}><Wallet /> Confirmar pagamento</Button>}<Button size="sm" variant="ghost" asChild><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.delivery_address)}`} target="_blank" rel="noreferrer"><MapPin /> Mapa</a></Button></div>}
      </article>;
    })}</div>}
    {tab === "stock" && <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card">{stock.length === 0 && <p className="p-4 text-sm text-muted-foreground">Não há produtos visíveis na loja.</p>}{stock.map((s) => <div key={s.product_id} className="flex items-center gap-3 border-b border-border p-3 last:border-0"><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{s.name}</strong><small className="text-muted-foreground">{s.unit_label}</small></div><Button size="sm" variant="outline" onClick={() => void saveStock(s, s.quantity - 1)}>−</Button><input type="number" className="h-9 w-20 rounded-md border border-input bg-background px-2 text-sm" defaultValue={s.quantity} key={s.quantity} onBlur={(e) => Number(e.target.value) !== s.quantity && void saveStock(s, Number(e.target.value))} /><Button size="sm" variant="outline" onClick={() => void saveStock(s, s.quantity + 1)}>+</Button></div>)}</div>}
  </Page>;
}
