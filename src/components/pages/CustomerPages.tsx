import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Check, CheckCheck, MapPin, Minus, Pencil, Plus, Save, ShoppingBasket, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { productImageStyle } from "@/lib/product-images";
import { stockState } from "@/components/AdminPanel";
import { Empty, Page, PageTitle, StatusTimeline, fieldCls, mzn, paymentLabel, statusLabel } from "@/components/ui-bits";

const sprite: Record<string, string> = { tomate: "product-tomate", batata: "product-batata", cenoura: "product-cenoura", cebola: "product-cebola", repolho: "product-repolho", pimento: "product-pimento" };
export const photoClass = (key: string) => sprite[key] ?? "product-generic";

function useUserId() {
  const [id, setId] = useState<string | null | undefined>(undefined);
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setId(data.user?.id ?? null)); }, []);
  return id;
}
function SignInFirst() { return <Empty title="Entre na sua conta" text="Inicie sessão para continuar." action="Entrar" to="/auth" />; }
function Loading() { return <p className="py-16 text-center text-sm text-muted-foreground">A carregar…</p>; }

/* ---------- Produto ---------- */
type Prod = { id: string; name: string; category: string; price: number; unit_label: string; min_quantity: number; image_key: string; stock: number; description: string };
export function ProductDetail({ id }: { id: string }) {
  const { add } = useStore();
  const navigate = useNavigate();
  const [p, setP] = useState<Prod | null | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState<Prod[]>([]);
  useEffect(() => {
    void supabase.from("products").select("id,name,category,price,unit_label,min_quantity,image_key,stock,description").eq("id", id).maybeSingle().then(async ({ data }) => {
      const prod = data ? { ...data, price: Number(data.price), stock: Number(data.stock), min_quantity: Number(data.min_quantity) } : null;
      setP(prod);
      if (prod) { const { data: r } = await supabase.from("products").select("id,name,category,price,unit_label,min_quantity,image_key,stock,description").eq("is_active", true).eq("category", prod.category).neq("id", id).limit(4); setRelated((r ?? []).map((x) => ({ ...x, price: Number(x.price), stock: Number(x.stock), min_quantity: Number(x.min_quantity) }))); }
    });
  }, [id]);
  if (p === undefined) return <Page><Loading /></Page>;
  if (!p) return <Page><Empty title="Produto não encontrado" text="Este produto já não está disponível." action="Ver produtos" to="/produtos" /></Page>;
  const st = stockState(p.stock);
  const addToCart = () => { for (let i = 0; i < qty; i++) add({ id: p.id, name: p.name, category: p.category, price: p.price, unitLabel: p.unit_label, minQuantity: p.min_quantity, imageKey: p.image_key, stock: p.stock }); void navigate({ to: "/carrinho" }); };
  return <Page wide>
    <PageTitle back="/produtos" title={p.name} subtitle={p.category} />
    <div className="grid gap-8 md:grid-cols-2">
      <div className={`product-photo rounded-lg ${photoClass(p.image_key)}`} style={productImageStyle(p.image_key)} />
      <div>
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
        <p className="mt-4 font-display text-4xl text-primary">{mzn(p.price)}</p>
        <p className="text-sm text-muted-foreground">por {p.unit_label}</p>
        {p.description && <p className="mt-5 leading-7 text-muted-foreground">{p.description}</p>}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center rounded-md border border-input"><Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos"><Minus /></Button><span className="w-10 text-center font-bold">{qty}</span><Button variant="ghost" size="icon" onClick={() => setQty(Math.min(Math.max(1, p.stock), qty + 1))} aria-label="Mais"><Plus /></Button></div>
          <strong>{mzn(p.price * p.min_quantity * qty)}</strong>
        </div>
        <Button size="lg" className="mt-6 w-full sm:w-auto" disabled={p.stock <= 0} onClick={addToCart}><ShoppingBasket /> Adicionar ao carrinho</Button>
      </div>
    </div>
    {related.length > 0 && <section className="mt-12"><h2 className="font-display text-2xl">Também pode gostar</h2><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{related.map((r) => <Link key={r.id} to="/produtos/$id" params={{ id: r.id }} className="overflow-hidden rounded-lg border border-border bg-card"><div className={`product-photo ${photoClass(r.image_key)}`} style={productImageStyle(r.image_key)} /><div className="p-3"><strong className="block text-sm">{r.name}</strong><span className="text-sm text-primary">{mzn(r.price)}</span></div></Link>)}</div></section>}
  </Page>;
}

/* ---------- Detalhe da encomenda ---------- */
type OrderFull = { id: string; order_number: number; status: string; payment_status: string; payment_method: string; delivery_address: string; subtotal: number; delivery_fee: number; discount: number; total: number; notes: string | null; created_at: string; promotion_code: string | null };
type Item = { id: string; product_name: string; unit_label: string; quantity: number; unit_price: number };
export function OrderDetail({ id }: { id: string }) {
  const [o, setO] = useState<OrderFull | null | undefined>(undefined);
  const [items, setItems] = useState<Item[]>([]);
  const load = () => {
    void supabase.from("orders").select("*").eq("id", id).maybeSingle().then(({ data }) => setO(data ? { ...data, subtotal: Number(data.subtotal), delivery_fee: Number(data.delivery_fee), discount: Number(data.discount), total: Number(data.total) } : null));
    void supabase.from("order_items").select("id,product_name,unit_label,quantity,unit_price").eq("order_id", id).then(({ data }) => setItems((data ?? []).map((i) => ({ ...i, quantity: Number(i.quantity), unit_price: Number(i.unit_price) }))));
  };
  useEffect(load, [id]);
  if (o === undefined) return <Page><Loading /></Page>;
  if (!o) return <Page><Empty title="Encomenda não encontrada" text="Verifique se tem sessão iniciada com a conta certa." action="Minhas encomendas" to="/encomendas" /></Page>;
  return <Page>
    <PageTitle back="/encomendas" title={`Encomenda #${o.order_number}`} subtitle={new Date(o.created_at).toLocaleString("pt-MZ")} />
    <section className="rounded-lg border border-border bg-card p-5"><h2 className="mb-4 font-display text-xl">{statusLabel[o.status]}</h2><StatusTimeline status={o.status} /></section>
    <section className="mt-4 rounded-lg border border-border bg-card p-5"><h2 className="font-display text-xl">Artigos</h2><div className="mt-3 divide-y divide-border">{items.map((i) => <div key={i.id} className="flex justify-between gap-3 py-2 text-sm"><span>{i.quantity} × {i.product_name} <small className="text-muted-foreground">({i.unit_label})</small></span><strong>{mzn(i.quantity * i.unit_price)}</strong></div>)}</div>
      <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm"><Row l="Produtos" v={mzn(o.subtotal)} /><Row l="Entrega" v={mzn(o.delivery_fee)} />{o.discount > 0 && <Row l={`Desconto${o.promotion_code ? ` (${o.promotion_code})` : ""}`} v={`−${mzn(o.discount)}`} />}<div className="flex justify-between pt-2 text-lg font-bold"><span>Total</span><span>{mzn(o.total)}</span></div></div></section>
    <section className="mt-4 grid gap-4 sm:grid-cols-2"><div className="rounded-lg border border-border bg-card p-5 text-sm"><strong className="block">Entrega</strong><p className="mt-1 text-muted-foreground"><MapPin className="mr-1 inline h-4 w-4" />{o.delivery_address}</p>{o.notes && <p className="mt-2 text-muted-foreground">Nota: {o.notes}</p>}</div><div className="rounded-lg border border-border bg-card p-5 text-sm"><strong className="block">Pagamento</strong><p className="mt-1 text-muted-foreground">{paymentLabel[o.payment_method]} · {o.payment_status === "paid" ? "Pago" : "Pendente"}</p></div></section>
  </Page>;
}
const Row = ({ l, v }: { l: string; v: string }) => <div className="flex justify-between"><span className="text-muted-foreground">{l}</span><span>{v}</span></div>;

/* ---------- Endereços ---------- */
type Addr = { id: string; label: string; address: string; city: string; is_default: boolean };
const emptyAddr = { label: "Casa", address: "", city: "Maputo", is_default: false };
export function Addresses() {
  const uid = useUserId();
  const [list, setList] = useState<Addr[]>([]);
  const [edit, setEdit] = useState<(typeof emptyAddr & { id?: string }) | null>(null);
  const [msg, setMsg] = useState("");
  const load = () => void supabase.from("user_addresses").select("id,label,address,city,is_default").order("created_at").then(({ data }) => setList(data ?? []));
  useEffect(() => { if (uid) load(); }, [uid]);
  if (uid === undefined) return <Page><Loading /></Page>;
  if (!uid) return <Page><SignInFirst /></Page>;
  const save = async () => {
    if (!edit || !edit.address.trim()) return setMsg("Escreva a morada.");
    const { id, ...row } = edit;
    if (row.is_default || list.length === 0) { await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", uid); row.is_default = true; }
    const { error } = id ? await supabase.from("user_addresses").update(row).eq("id", id) : await supabase.from("user_addresses").insert({ ...row, user_id: uid });
    if (error) return setMsg("Erro: " + error.message);
    setEdit(null); setMsg(""); load();
  };
  const makeDefault = async (a: Addr) => { await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", uid); await supabase.from("user_addresses").update({ is_default: true }).eq("id", a.id); load(); };
  const del = async (a: Addr) => { if (!confirm(`Remover "${a.label}"?`)) return; await supabase.from("user_addresses").delete().eq("id", a.id); load(); };
  return <Page>
    <PageTitle back="/conta" title="Endereços de entrega" subtitle="Escolha onde quer receber as encomendas." />
    <Button onClick={() => setEdit({ ...emptyAddr })}><Plus /> Novo endereço</Button>
    {edit && <div className="mt-4 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
      <label className="text-sm">Nome (ex.: Casa, Trabalho)<input className={fieldCls} value={edit.label} onChange={(e) => setEdit({ ...edit, label: e.target.value })} /></label>
      <label className="text-sm">Cidade<input className={fieldCls} value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} /></label>
      <label className="text-sm sm:col-span-2">Morada completa<input className={fieldCls} value={edit.address} placeholder="Bairro, rua, número, referência" onChange={(e) => setEdit({ ...edit, address: e.target.value })} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.is_default} onChange={(e) => setEdit({ ...edit, is_default: e.target.checked })} /> Endereço principal</label>
      {msg && <p className="text-sm text-destructive sm:col-span-2">{msg}</p>}
      <div className="flex gap-2 sm:col-span-2"><Button onClick={() => void save()}><Save /> Guardar</Button><Button variant="outline" onClick={() => setEdit(null)}><X /> Cancelar</Button></div>
    </div>}
    <div className="mt-5 space-y-3">{list.length === 0 && !edit && <Empty icon={MapPin} title="Sem endereços" text="Adicione um endereço para finalizar encomendas mais depressa." />}{list.map((a) => <article key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4"><MapPin className="text-primary" /><div className="min-w-40 flex-1"><strong className="block">{a.label}{a.is_default && <span className="ml-2 rounded-full bg-leaf-soft px-2 py-0.5 text-[10px] font-bold text-primary">Principal</span>}</strong><small className="text-muted-foreground">{a.address}, {a.city}</small></div>{!a.is_default && <Button size="sm" variant="outline" onClick={() => void makeDefault(a)}><Star /> Principal</Button>}<Button size="icon" variant="outline" aria-label="Editar" onClick={() => setEdit(a)}><Pencil /></Button><Button size="icon" variant="outline" aria-label="Remover" onClick={() => void del(a)}><Trash2 /></Button></article>)}</div>
  </Page>;
}

/* ---------- Notificações ---------- */
type Notif = { id: string; title: string; message: string; order_id: string | null; is_read: boolean; created_at: string };
export function Notifications() {
  const uid = useUserId();
  const [list, setList] = useState<Notif[]>([]);
  const load = () => void supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => setList(data ?? []));
  useEffect(() => { if (uid) load(); }, [uid]);
  if (uid === undefined) return <Page><Loading /></Page>;
  if (!uid) return <Page><SignInFirst /></Page>;
  const readAll = async () => { await supabase.from("notifications").update({ is_read: true }).eq("user_id", uid).eq("is_read", false); load(); };
  const read = async (n: Notif) => { if (!n.is_read) { await supabase.from("notifications").update({ is_read: true }).eq("id", n.id); load(); } };
  return <Page>
    <PageTitle back="/conta" title="Notificações" subtitle="Novidades sobre as suas encomendas." />
    {list.some((n) => !n.is_read) && <Button variant="outline" size="sm" onClick={() => void readAll()}><CheckCheck /> Marcar todas como lidas</Button>}
    <div className="mt-4 space-y-3">{list.length === 0 && <Empty icon={Bell} title="Sem notificações" text="Quando a sua encomenda mudar de estado, avisamos aqui." />}{list.map((n) => {
      const body = <div className={`flex gap-3 rounded-lg border p-4 ${n.is_read ? "border-border bg-card" : "border-primary bg-leaf-soft"}`}><Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div className="flex-1"><strong className="block text-sm">{n.title}</strong><p className="text-sm text-muted-foreground">{n.message}</p><small className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-MZ")}</small></div>{!n.is_read && <Check className="h-4 w-4 text-primary" />}</div>;
      return n.order_id ? <Link key={n.id} to="/encomendas/$id" params={{ id: n.order_id }} onClick={() => void read(n)} className="block">{body}</Link> : <button key={n.id} className="block w-full text-left" onClick={() => void read(n)}>{body}</button>;
    })}</div>
  </Page>;
}

/* ---------- Perfil ---------- */
export function Profile() {
  const uid = useUserId();
  const [form, setForm] = useState({ full_name: "", phone: "", nuit: "" });
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!uid) return;
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    void supabase.from("profiles").select("full_name,phone,nuit").eq("id", uid).maybeSingle().then(({ data }) => data && setForm({ full_name: data.full_name, phone: data.phone, nuit: data.nuit ?? "" }));
  }, [uid]);
  if (uid === undefined) return <Page><Loading /></Page>;
  if (!uid) return <Page><SignInFirst /></Page>;
  const save = async () => {
    const { error } = await supabase.from("profiles").upsert({ id: uid, full_name: form.full_name.trim(), phone: form.phone.trim(), nuit: form.nuit.trim() || null });
    setMsg(error ? "Erro: " + error.message : "Perfil guardado.");
  };
  return <Page>
    <PageTitle back="/conta" title="O meu perfil" subtitle="Dados usados nas suas encomendas e faturas." />
    <div className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
      <label className="text-sm sm:col-span-2">Email<input className={fieldCls} value={email} disabled /></label>
      <label className="text-sm">Nome completo<input className={fieldCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
      <label className="text-sm">Telefone<input className={fieldCls} value={form.phone} placeholder="+258 84 000 0000" onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
      <label className="text-sm">NUIT (opcional)<input className={fieldCls} value={form.nuit} onChange={(e) => setForm({ ...form, nuit: e.target.value })} /></label>
      {msg && <p className="text-sm text-primary sm:col-span-2">{msg}</p>}
      <div className="sm:col-span-2"><Button onClick={() => void save()}><Save /> Guardar</Button></div>
    </div>
  </Page>;
}

/* ---------- Definições ---------- */
export function SettingsPage() {
  const uid = useUserId();
  const { clear, count } = useStore();
  const navigate = useNavigate();
  const [pw, setPw] = useState({ a: "", b: "" });
  const [msg, setMsg] = useState("");
  if (uid === undefined) return <Page><Loading /></Page>;
  const changePw = async () => {
    if (pw.a.length < 8) return setMsg("A palavra-passe deve ter pelo menos 8 caracteres.");
    if (pw.a !== pw.b) return setMsg("As palavras-passe não coincidem.");
    const { error } = await supabase.auth.updateUser({ password: pw.a });
    setMsg(error ? "Erro: " + error.message : "Palavra-passe alterada."); setPw({ a: "", b: "" });
  };
  return <Page>
    <PageTitle back="/conta" title="Definições" subtitle="Segurança e preferências da conta." />
    {uid && <section className="rounded-lg border border-border bg-card p-5"><h2 className="font-display text-xl">Alterar palavra-passe</h2><div className="mt-3 grid gap-3 sm:grid-cols-2"><input type="password" className={fieldCls} placeholder="Nova palavra-passe" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} /><input type="password" className={fieldCls} placeholder="Repetir palavra-passe" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} /></div>{msg && <p className="mt-2 text-sm text-primary">{msg}</p>}<Button className="mt-3" onClick={() => void changePw()}><Save /> Alterar</Button></section>}
    <section className="mt-4 rounded-lg border border-border bg-card p-5"><h2 className="font-display text-xl">Carrinho</h2><p className="mt-1 text-sm text-muted-foreground">{count} artigos guardados neste dispositivo.</p><Button className="mt-3" variant="outline" disabled={count === 0} onClick={clear}><Trash2 /> Esvaziar carrinho</Button></section>
    <section className="mt-4 rounded-lg border border-border bg-card p-5 text-sm"><h2 className="font-display text-xl">Idioma e moeda</h2><p className="mt-1 text-muted-foreground">Português (Moçambique) · Meticais (MZN)</p></section>
    {uid && <Button className="mt-6" variant="outline" onClick={() => void supabase.auth.signOut().then(() => navigate({ to: "/" }))}>Terminar sessão</Button>}
  </Page>;
}
