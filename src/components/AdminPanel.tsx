import { useEffect, useState } from "react";
import { Package, Pencil, Plus, Save, Sprout, Trash2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { productImageKeys } from "@/lib/product-images";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "operator" | "customer";
type Product = { id: string; name: string; category: string; price: number; unit_label: string; min_quantity: number; stock: number; image_key: string; description: string; is_active: boolean; is_featured: boolean };
type Person = { id: string; full_name: string; phone: string; roles: Role[] };
type Order = { id: string; order_number: number; status: string; total: number; payment_status: string; operator_id: string | null; created_at: string };

const emptyProduct: Omit<Product, "id"> = { name: "", category: "Legumes", price: 0, unit_label: "saco de 10 kg", min_quantity: 1, stock: 0, image_key: "generic", description: "", is_active: true, is_featured: false };
const statuses: Array<[string, string]> = [["received", "Recebida"], ["preparing", "Em preparação"], ["on_the_way", "A caminho"], ["almost_there", "Quase a chegar"], ["delivered", "Entregue"], ["cancelled", "Cancelada"]];
const roleLabel: Record<Role, string> = { admin: "Administrador", operator: "Operador", customer: "Cliente" };

export function stockState(stock: number) {
  if (stock <= 0) return { label: "Fora de stock", cls: "bg-destructive/10 text-destructive" };
  if (stock <= 10) return { label: `Últimas ${stock}`, cls: "bg-harvest/20 text-harvest-deep" };
  return { label: "Em stock", cls: "bg-leaf-soft text-primary" };
}

export function AdminPanel() {
  const [tab, setTab] = useState<"products" | "stock" | "users" | "orders">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editing, setEditing] = useState<(Omit<Product, "id"> & { id?: string }) | null>(null);
  const [msg, setMsg] = useState("");

  const loadProducts = async () => { const { data } = await supabase.from("products").select("*").order("name"); setProducts((data ?? []).map((p) => ({ ...p, price: Number(p.price), stock: Number(p.stock), min_quantity: Number(p.min_quantity) }))); };
  const loadPeople = async () => {
    const [{ data: prof }, { data: roles }] = await Promise.all([supabase.from("profiles").select("id,full_name,phone").order("created_at"), supabase.from("user_roles").select("user_id,role")]);
    setPeople((prof ?? []).map((p) => ({ ...p, roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as Role) })));
  };
  const loadOrders = async () => { const { data } = await supabase.from("orders").select("id,order_number,status,total,payment_status,operator_id,created_at").order("created_at", { ascending: false }).limit(100); setOrders((data ?? []).map((o) => ({ ...o, total: Number(o.total) }))); };
  useEffect(() => { void loadProducts(); void loadPeople(); void loadOrders(); }, []);
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2500); };

  const saveProduct = async () => {
    if (!editing || !editing.name.trim()) return flash("Indique o nome do produto.");
    const { id, ...row } = editing;
    const { error } = id ? await supabase.from("products").update(row).eq("id", id) : await supabase.from("products").insert(row);
    if (error) return flash("Erro: " + error.message);
    setEditing(null); flash("Produto guardado."); void loadProducts();
  };
  const removeProduct = async (p: Product) => {
    if (!confirm(`Remover ${p.name}?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) { await supabase.from("products").update({ is_active: false }).eq("id", p.id); flash("Produto tem encomendas — foi desativado."); } else flash("Produto removido.");
    void loadProducts();
  };
  const toggleVisible = async (p: Product) => { await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id); void loadProducts(); };
  const setStock = async (p: Product, stock: number) => { await supabase.from("products").update({ stock: Math.max(0, stock) }).eq("id", p.id); void loadProducts(); };
  const toggleRole = async (person: Person, role: Role) => {
    const has = person.roles.includes(role);
    const { error } = has ? await supabase.from("user_roles").delete().eq("user_id", person.id).eq("role", role) : await supabase.from("user_roles").insert({ user_id: person.id, role });
    if (error) flash("Erro: " + error.message); else flash("Permissões atualizadas.");
    void loadPeople();
  };
  const updateOrder = async (id: string, patch: { status?: Order["status"]; operator_id?: string | null; payment_status?: string }) => {
    const { error } = await supabase.from("orders").update(patch as never).eq("id", id);
    if (error) flash("Erro: " + error.message); void loadOrders();
  };

  const operators = people.filter((p) => p.roles.includes("operator"));
  const inStock = products.filter((p) => p.stock > 0);
  const out = products.filter((p) => p.stock <= 0);
  const tabs: Array<[typeof tab, string, typeof Sprout]> = [["products", "Produtos", Sprout], ["stock", "Stock", Package], ["users", "Utilizadores e operadores", Users], ["orders", "Encomendas", Package]];
  const input = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

  return <main className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6">
    <h1 className="font-display text-3xl sm:text-4xl">Gestão Horta Boa</h1>
    <p className="mt-1 text-sm text-muted-foreground">Produtos, stock, utilizadores, operadores e encomendas.</p>
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[["Produtos", products.length], ["Em stock", inStock.length], ["Fora de stock", out.length], ["Operadores", operators.length]].map(([l, v]) => <article key={l} className="rounded-lg border border-border bg-card p-4"><span className="text-xs text-muted-foreground">{l}</span><strong className="mt-1 block font-display text-2xl">{v}</strong></article>)}
    </div>
    <div className="hide-scrollbar mt-6 flex gap-2 overflow-x-auto">{tabs.map(([k, l, I]) => <Button key={k} size="sm" variant={tab === k ? "default" : "outline"} onClick={() => setTab(k)}><I />{l}</Button>)}</div>
    {msg && <p className="mt-4 rounded-md bg-leaf-soft px-3 py-2 text-sm text-primary">{msg}</p>}

    {tab === "products" && <section className="mt-5">
      <Button onClick={() => setEditing({ ...emptyProduct })}><Plus /> Novo produto</Button>
      {editing && <div className="mt-4 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
        <label className="text-sm">Nome<input className={input} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
        <label className="text-sm">Categoria<input className={input} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></label>
        <label className="text-sm">Embalagem (ex.: saco de 10 kg)<input className={input} value={editing.unit_label} onChange={(e) => setEditing({ ...editing, unit_label: e.target.value })} /></label>
        <label className="text-sm">Preço (MZN)<input type="number" className={input} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></label>
        <label className="text-sm">Stock (embalagens)<input type="number" className={input} value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} /></label>
        <label className="text-sm">Imagem<select className={input} value={editing.image_key} onChange={(e) => setEditing({ ...editing, image_key: e.target.value })}>{productImageKeys.map((k) => <option key={k}>{k}</option>)}</select></label>
        <label className="text-sm sm:col-span-2">Descrição<input className={input} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Visível na loja</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} /> Popular</label>
        <div className="flex gap-2 sm:col-span-2"><Button onClick={() => void saveProduct()}><Save /> Guardar</Button><Button variant="outline" onClick={() => setEditing(null)}><X /> Cancelar</Button></div>
      </div>}
      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">{products.map((p) => <div key={p.id} className="flex flex-wrap items-center gap-3 border-b border-border p-3 last:border-0">
        <div className="min-w-40 flex-1"><strong className="block text-sm">{p.name}{!p.is_active && <span className="ml-2 text-xs text-muted-foreground">(oculto)</span>}</strong><small className="text-muted-foreground">{p.category} · {p.unit_label}</small></div>
        <span className={`rounded-full px-2 py-1 text-xs font-bold ${stockState(p.stock).cls}`}>{stockState(p.stock).label}</span>
        <strong className="w-24 text-right text-sm">{p.price.toLocaleString("pt-MZ")} MZN</strong>
        <Button size="sm" variant={p.is_active ? "default" : "outline"} onClick={() => void toggleVisible(p)}>{p.is_active ? "Visível" : "Oculto"}</Button>
        <Button size="icon" variant="outline" aria-label="Editar" onClick={() => setEditing(p)}><Pencil /></Button>
        <Button size="icon" variant="outline" aria-label="Remover" onClick={() => void removeProduct(p)}><Trash2 /></Button>
      </div>)}</div>
    </section>}

    {tab === "stock" && <section className="mt-5 grid gap-6 lg:grid-cols-2">
      {([["Em stock", inStock], ["Fora de stock", out]] as const).map(([title, list]) => <div key={title}><h2 className="font-display text-2xl">{title} ({list.length})</h2><div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">{list.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum produto.</p>}{list.map((p) => <div key={p.id} className="flex items-center gap-3 border-b border-border p-3 last:border-0"><div className="flex-1"><strong className="block text-sm">{p.name}</strong><small className="text-muted-foreground">{p.stock} × {p.unit_label}</small></div><Button size="sm" variant="outline" onClick={() => void setStock(p, p.stock - 1)}>−</Button><input type="number" className="h-9 w-20 rounded-md border border-input bg-background px-2 text-sm" defaultValue={p.stock} key={p.stock} onBlur={(e) => Number(e.target.value) !== p.stock && void setStock(p, Number(e.target.value))} /><Button size="sm" variant="outline" onClick={() => void setStock(p, p.stock + 1)}>+</Button>{p.stock > 0 && <Button size="sm" variant="ghost" onClick={() => void setStock(p, 0)}>Esgotar</Button>}</div>)}</div></div>)}
    </section>}

    {tab === "users" && <section className="mt-5 overflow-hidden rounded-lg border border-border bg-card">{people.length === 0 && <p className="p-4 text-sm text-muted-foreground">Ainda não há utilizadores registados.</p>}{people.map((u) => <div key={u.id} className="flex flex-wrap items-center gap-3 border-b border-border p-3 last:border-0">
      <div className="min-w-40 flex-1"><strong className="block text-sm">{u.full_name || "Sem nome"}</strong><small className="text-muted-foreground">{u.phone || "Sem telefone"} · {u.roles.map((r) => roleLabel[r]).join(", ") || "Cliente"}</small></div>
      {(["operator", "admin"] as const).map((r) => <Button key={r} size="sm" variant={u.roles.includes(r) ? "default" : "outline"} onClick={() => void toggleRole(u, r)}>{u.roles.includes(r) ? `Remover ${roleLabel[r].toLowerCase()}` : `Tornar ${roleLabel[r].toLowerCase()}`}</Button>)}
    </div>)}</section>}

    {tab === "orders" && <section className="mt-5 overflow-hidden rounded-lg border border-border bg-card">{orders.length === 0 && <p className="p-4 text-sm text-muted-foreground">Ainda não há encomendas.</p>}{orders.map((o) => <div key={o.id} className="flex flex-wrap items-center gap-3 border-b border-border p-3 last:border-0">
      <div className="min-w-32 flex-1"><strong className="block text-sm">#{o.order_number}</strong><small className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-MZ")} · {o.total.toLocaleString("pt-MZ")} MZN</small></div>
      <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={o.status} onChange={(e) => void updateOrder(o.id, { status: e.target.value })}>{statuses.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={o.operator_id ?? ""} onChange={(e) => void updateOrder(o.id, { operator_id: e.target.value || null })}><option value="">Sem operador</option>{operators.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.id.slice(0, 8)}</option>)}</select>
      <Button size="sm" variant={o.payment_status === "paid" ? "default" : "outline"} onClick={() => void updateOrder(o.id, { payment_status: o.payment_status === "paid" ? "pending" : "paid" })}>{o.payment_status === "paid" ? "Pago" : "Marcar pago"}</Button>
    </div>)}</section>}
  </main>;
}
