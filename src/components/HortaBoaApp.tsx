import { checkoutTotals } from "@/lib/checkout";
import { productImageStyle } from "@/lib/product-images";
import { filterCatalogue, produceFamily } from "@/lib/catalog";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, BarChart3, Bell, Check, ChevronRight, CircleUserRound, Clock3,
  Heart, Home, Leaf, LogOut, MapPin, Menu, Minus, Package, Plus, Search,
  Settings, ShoppingBasket, ShoppingCart, Sprout, Store, Trash2, Truck, Users, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useStore, type CartProduct } from "@/lib/store";
import { AdminPanel, stockState } from "@/components/AdminPanel";
import { OperatorPanel } from "@/components/pages/OperatorPanel";
import { Empty, PageTitle, fieldCls, mzn } from "@/components/ui-bits";
import heroImage from "@/assets/horta-boa-hero.jpg";
import logoMark from "@/assets/horta-boa-mark.png";

type View = "catalog" | "cart" | "orders" | "account" | "admin" | "operator" | "page";
type DbProduct = { id: string; name: string; category: string; price: number; unit_label: string; min_quantity: number; image_key: string; stock: number; description: string; is_featured: boolean };
type Order = { id: string; order_number: number; status: string; payment_status: string; total: number; delivery_address: string; created_at: string };
type AppRole = "admin" | "operator" | "customer";

const fallbackProducts: DbProduct[] = [
  ["tomate", "Tomate Fresco", "Frutos", 800, "caixa de 10 kg", 1, 40, "Tomate maduro, firme e selecionado diariamente."],
  ["batata", "Batata Reno", "Tubérculos", 600, "saco de 10 kg", 1, 50, "Ideal para cozer, fritar ou assar."],
  ["cenoura", "Cenoura", "Raízes", 330, "saco de 5 kg", 1, 30, "Crocante, doce e rica em cor."],
  ["cebola", "Cebola", "Bolbos", 550, "saco de 10 kg", 1, 45, "Cebola dourada de sabor equilibrado."],
  ["repolho", "Repolho Verde", "Folhas", 250, "saco de 5 unidades", 1, 25, "Fresco, compacto e colhido localmente."],
  ["pimento", "Pimento Verde", "Frutos", 560, "caixa de 5 kg", 1, 15, "Fresco e aromático."],
].map(([key, name, category, price, unit, minimum, stock, description], index) => ({ id: String(key), image_key: String(key), name: String(name), category: String(category), price: Number(price), unit_label: String(unit), min_quantity: Number(minimum), stock: Number(stock), description: String(description), is_featured: index < 4 }));

const statusLabel: Record<string, string> = { received: "Recebida", preparing: "Em preparação", on_the_way: "A caminho", almost_there: "Quase a chegar", delivered: "Entregue", cancelled: "Cancelada" };
const productPositions: Record<string, string> = { tomate: "product-tomate", batata: "product-batata", cenoura: "product-cenoura", cebola: "product-cebola", repolho: "product-repolho", pimento: "product-pimento" };

export function HortaBoaApp({ view, children, catalogMode = "home", family = "" }: { view: View; children?: React.ReactNode; catalogMode?: "home" | "products"; family?: string }) {
  const navigate = useNavigate();
  const { lines, count, subtotal, add, change, remove, clear } = useStore();
  const [products, setProducts] = useState<DbProduct[]>(fallbackProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [identityReady, setIdentityReady] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void supabase.from("products").select("id,name,category,price,unit_label,min_quantity,image_key,stock,description,is_featured").eq("is_active", true).order("is_featured", { ascending: false }).then(({ data }) => {
      if (data?.length) setProducts(data.map((item) => ({ ...item, price: Number(item.price), min_quantity: Number(item.min_quantity), stock: Number(item.stock) })));
    });
    void supabase.auth.getUser().then(async ({ data }) => {
      setUserEmail(data.user?.email || data.user?.phone || null);
      if (data.user) {
        const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
        const roles = (roleRows ?? []).map((row) => row.role as AppRole);
        setRole(roles.includes("admin") ? "admin" : roles.includes("operator") ? "operator" : "customer");
      }
      setIdentityReady(true);
    });
  }, []);

  useEffect(() => {
    if (view !== "orders" || !userEmail) return;
    void supabase.from("orders").select("id,order_number,status,payment_status,total,delivery_address,created_at").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setOrders(data.map((order) => ({ ...order, total: Number(order.total) })));
    });
  }, [view, userEmail]);

  const categories = ["Todos", ...Array.from(new Set(products.map((product) => product.category)))];
  const visible = useMemo(() => filterCatalogue(products, query, category, catalogMode === "products" ? family : ""), [products, query, category, catalogMode, family]);
  const asCartProduct = (product: DbProduct): CartProduct => ({ id: product.id, name: product.name, category: product.category, price: product.price, unitLabel: product.unit_label, minQuantity: product.min_quantity, imageKey: product.image_key, stock: product.stock });

  async function signOut() {
    await supabase.auth.signOut();
    setUserEmail(null);
    await navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><Menu /></Button>
          <Link to="/" className="flex items-center gap-2.5" aria-label="Horta Boa">
            <img src={logoMark} alt="" className="h-10 w-10 object-contain" width={1024} height={1024} />
            <div><strong className="block font-display text-xl leading-none text-primary">Horta Boa</strong><span className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Fresco da nossa terra</span></div>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            <NavItem to="/" icon={Home} label="Início" />
            <NavItem to="/produtos" icon={Sprout} label="Produtos" />
            <NavItem to="/encomendas" icon={Package} label="Encomendas" />
            <NavItem to="/conta" icon={CircleUserRound} label="Conta" />
          </nav>
          {userEmail && <Link to="/conta/notificacoes" className="ml-auto flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent lg:ml-3" aria-label="Notificações"><Bell className="h-5 w-5" /></Link>}
          <Link to="/carrinho" className={`relative ${userEmail ? "ml-1" : "ml-auto lg:ml-3"}`}><span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground"><ShoppingBasket className="h-5 w-5" /></span>{count > 0 && <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-harvest px-1 text-[10px] font-bold text-harvest-foreground">{count}</span>}</Link>
        </div>
      </header>

      {menuOpen && <div className="fixed inset-0 z-50 bg-overlay" onClick={() => setMenuOpen(false)}><aside className="h-full w-[84%] max-w-sm bg-background p-5" onClick={(event) => event.stopPropagation()}><div className="mb-8 flex items-center justify-between"><span className="font-display text-2xl text-primary">Horta Boa</span><Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}><X /></Button></div><div className="grid gap-2"><NavItem to="/" icon={Home} label="Início" /><NavItem to="/produtos" icon={Sprout} label="Produtos" /><NavItem to="/carrinho" icon={ShoppingCart} label="Carrinho" /><NavItem to="/encomendas" icon={Package} label="Encomendas" /><NavItem to="/conta" icon={CircleUserRound} label="Conta" /></div></aside></div>}

      {view === "catalog" && <Catalog mode={catalogMode} family={family} products={visible} allProducts={products} categories={categories} category={category} setCategory={setCategory} query={query} setQuery={setQuery} add={(product) => { add(asCartProduct(product)); setNotice(`${product.name} adicionado ao carrinho`); }} />}
      {view === "cart" && <Cart lines={lines} subtotal={subtotal} change={change} remove={remove} clear={clear} />}
      {view === "orders" && <Orders orders={orders} signedIn={Boolean(userEmail)} />}
      {view === "account" && <Account email={userEmail} role={role} signOut={signOut} />}
      {view === "page" && children}
      {view === "admin" && (identityReady && role === "admin" ? <AdminPanel /> : <RestrictedArea ready={identityReady} signedIn={Boolean(userEmail)} />)}
      {view === "operator" && (identityReady && (role === "operator" || role === "admin") ? <OperatorPanel isAdmin={role === "admin"} /> : <RestrictedArea ready={identityReady} signedIn={Boolean(userEmail)} />)}

      {notice && view !== "cart" && <button className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-md bg-foreground px-4 py-3 text-sm font-medium text-background shadow-xl" onClick={() => setNotice("")}>{notice}</button>}
      {view === "catalog" && count > 0 && (
        <Link to="/carrinho" className="fixed bottom-[4.75rem] left-3 right-3 z-40 lg:bottom-4 lg:left-auto lg:right-6 lg:w-96">
          <span className="flex items-center gap-3 rounded-lg bg-primary px-4 py-3 text-primary-foreground shadow-xl transition hover:bg-primary/90">
            <ShoppingCart className="h-5 w-5 shrink-0" />
            <span className="min-w-0 flex-1">
              <strong className="block text-sm leading-tight">Ver carrinho</strong>
              <span className="text-xs text-primary-foreground/80">{count} {count === 1 ? "artigo" : "artigos"}</span>
            </span>
            <strong className="shrink-0 text-sm">{subtotal.toLocaleString("pt-MZ")} MZN</strong>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </span>
        </Link>
      )}
      <MobileNav count={count} />
    </div>
  );
}

function Catalog({ mode, family, products, allProducts, categories, category, setCategory, query, setQuery, add }: { mode: "home" | "products"; family: string; products: DbProduct[]; allProducts: DbProduct[]; categories: string[]; category: string; setCategory: (v: string) => void; query: string; setQuery: (v: string) => void; add: (product: DbProduct) => void }) {
  return <main className="pb-28">
    {mode === "home" && <section className="relative min-h-[520px] overflow-hidden bg-forest text-primary-foreground sm:min-h-[590px]">
      <img src={heroImage} alt="Cesto com hortícolas frescos numa machamba" className="absolute inset-0 h-full w-full object-cover" width={1600} height={912} />
      <div className="absolute inset-0 bg-hero-overlay" />
      <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-end px-5 pb-12 pt-24 sm:min-h-[590px] sm:px-8 sm:pb-16">
        <div className="max-w-xl"><span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em]"><Leaf className="h-3.5 w-3.5" /> Da machamba para si</span><h1 className="font-display text-5xl leading-[.95] sm:text-7xl">Fresco. Local.<br />Todos os dias.</h1><p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/85 sm:text-lg">Os melhores hortícolas, selecionados com cuidado e entregues à sua porta em Maputo.</p><div className="mt-7 flex flex-wrap gap-3"><Button size="lg" variant="harvest" asChild><a href="#catalogo">Comprar agora <ChevronRight /></a></Button><span className="flex items-center gap-2 text-sm font-semibold"><Truck className="h-5 w-5 text-harvest" /> Entrega gratuita</span></div></div>
      </div>
    </section>}
    <section id="catalogo" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><span className="text-xs font-bold uppercase tracking-[.16em] text-tomato">{mode === "home" ? "Colheita de hoje" : family ? "Variantes" : "Catálogo completo"}</span><h2 className="mt-1 font-display text-3xl sm:text-4xl">{mode === "home" ? "Escolha o mais fresco" : family ? `Todas as variantes de ${family}` : "Todos os produtos"}</h2><p className="mt-2 text-sm text-muted-foreground">{mode === "home" ? `${allProducts.length} produtos disponíveis na nossa loja.` : `${products.length} produtos encontrados.`}</p>{family && <Link to="/produtos" className="mt-2 inline-block text-sm font-semibold text-primary">Ver todos os produtos</Link>}</div><label className="flex h-11 w-full items-center gap-2 rounded-md border border-input bg-card px-3 sm:w-80"><Search className="h-4 w-4 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar hortícolas" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label></div>
      <div className="hide-scrollbar mb-7 flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <Button key={item} variant={category === item ? "default" : "outline"} size="sm" onClick={() => setCategory(item)}>{item}</Button>)}</div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{products.map((product) => <article key={product.id} className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><Link {...productLink(mode, product)} className={`product-photo block ${productPositions[product.image_key] ?? "product-generic"}`} style={productImageStyle(product.image_key)}>{product.is_featured && <span className="absolute left-2 top-2 rounded-full bg-harvest px-2 py-1 text-[10px] font-bold uppercase text-harvest-foreground">Popular</span>}</Link><div className="p-3 sm:p-4"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{product.category}</span><Link {...productLink(mode, product)}><h3 className="mt-1 min-h-10 font-display text-lg leading-5 hover:text-primary">{product.name}</h3></Link><p className="mt-2 hidden text-xs leading-5 text-muted-foreground sm:block">{product.description}</p><div className="mt-4 flex items-end justify-between gap-2"><div><strong className="text-lg text-primary">{product.price.toLocaleString("pt-MZ")} MZN</strong><span className="block text-[11px] text-muted-foreground">por {product.min_quantity === 1 ? product.unit_label : `${product.min_quantity} ${product.unit_label}`}</span></div><Button size="icon" disabled={product.stock <= 0} onClick={() => add(product)} aria-label={`Adicionar ${product.name}`}><Plus /></Button></div><span className={`mt-3 inline-block rounded-full px-2 py-1 text-[11px] font-bold ${stockState(product.stock).cls}`}>{stockState(product.stock).label}</span></div></article>)}</div>
    </section>
    <section className="border-y border-border bg-leaf-soft"><div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:grid-cols-3 sm:px-6"><Feature icon={Sprout} title="Colheita selecionada" text="Escolhemos produtos frescos de produtores locais." /><Feature icon={Truck} title="Entrega rápida" text="Receba a sua encomenda sem sair de casa." /><Feature icon={Check} title="Qualidade garantida" text="Se não estiver fresco, fazemos a substituição." /></div></section>
  </main>;
}

function productLink(mode: "home" | "products", product: DbProduct) {
  return mode === "home" ? { to: "/produtos" as const, search: { familia: produceFamily(product.name) } } : { to: "/produtos/$id" as const, params: { id: product.id } };
}

type Method = "mpesa" | "emola" | "pos" | "cash";
type Addr = { id: string; label: string; address: string; city: string; is_default: boolean };
function Cart({ lines, subtotal, change, remove, clear }: { lines: ReturnType<typeof useStore>["lines"]; subtotal: number; change: (id: string, delta: number) => void; remove: (id: string) => void; clear: () => void }) {
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>("mpesa");
  const [signedIn, setSignedIn] = useState(false);
  const [addresses, setAddresses] = useState<Addr[]>([]);
  const [addrId, setAddrId] = useState("");
  const [manual, setManual] = useState("");
  const [notes, setNotes] = useState("");
  const [store, setStore] = useState<{ id: string; fee: number } | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void supabase.from("stores").select("id,delivery_fee").eq("is_active", true).order("created_at").limit(1).maybeSingle().then(({ data }) => data && setStore({ id: data.id, fee: Number(data.delivery_fee) }));
    void supabase.auth.getUser().then(({ data }) => { if (!data.user) return; setSignedIn(true); void supabase.from("user_addresses").select("id,label,address,city,is_default").order("is_default", { ascending: false }).then(({ data: a }) => { setAddresses(a ?? []); if (a?.[0]) setAddrId(a[0].id); }); });
  }, []);
  const { deliveryFee: fee, discount, total } = checkoutTotals(subtotal);
  const placeOrder = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { await navigate({ to: "/auth" }); return; }
    const chosen = addresses.find((a) => a.id === addrId);
    const address = chosen ? `${chosen.address}, ${chosen.city}` : manual.trim();
    if (!address) { setNotice("Indique o endereço de entrega."); return; }
    const outOfStock = lines.find((l) => l.stock <= 0);
    if (outOfStock) { setNotice(`${outOfStock.name} está fora de stock.`); return; }
    setBusy(true);
    const { data: order, error } = await supabase.from("orders").insert({ user_id: auth.user.id, store_id: store?.id ?? null, payment_method: method, delivery_address: address, subtotal, delivery_fee: fee, discount, total, notes: notes.trim() || null }).select("id").single();
    if (error || !order) { setBusy(false); setNotice("Não foi possível criar a encomenda. Tente novamente."); return; }
    const { error: itemsError } = await supabase.from("order_items").insert(lines.map((line) => ({ order_id: order.id, product_id: line.id, product_name: line.name, unit_label: line.unitLabel, quantity: line.quantity * line.minQuantity, unit_price: line.price })));
    setBusy(false);
    if (itemsError) { setNotice("A encomenda foi criada, mas os itens precisam de confirmação."); return; }
    clear();
    await navigate({ to: "/encomendas/$id", params: { id: order.id } });
  };
  return <main className="mx-auto min-h-[calc(100vh-72px)] max-w-6xl px-4 pb-28 pt-8 sm:px-6"><PageTitle back="/produtos" title="O seu carrinho" subtitle={`${lines.length} tipos de produtos selecionados`} />{lines.length === 0 ? <Empty icon={ShoppingBasket} title="O seu cesto está vazio" text="Escolha produtos frescos para começar a sua encomenda." action="Ver produtos" to="/produtos" /> : <div className="grid gap-8 lg:grid-cols-[1.35fr_.65fr]"><div className="space-y-3">{lines.map((line) => <article key={line.id} className="flex gap-4 rounded-lg border border-border bg-card p-3"><div className={`product-thumb ${productPositions[line.imageKey] ?? "product-generic"}`} style={productImageStyle(line.imageKey)} /><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div><h3 className="font-display text-lg">{line.name}</h3><p className="text-xs text-muted-foreground">{mzn(line.price)} / {line.unitLabel}</p></div><Button variant="ghost" size="icon" onClick={() => remove(line.id)} aria-label="Remover"><Trash2 className="text-destructive" /></Button></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center rounded-md border border-input"><Button variant="ghost" size="icon" onClick={() => change(line.id, -1)} aria-label="Menos"><Minus /></Button><span className="w-8 text-center text-sm font-bold">{line.quantity}</span><Button variant="ghost" size="icon" onClick={() => change(line.id, 1)} aria-label="Mais"><Plus /></Button></div><strong>{mzn(line.price * line.minQuantity * line.quantity)}</strong></div></div></article>)}</div>
  <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-sm">
    <h2 className="font-display text-2xl">Resumo</h2>
    <div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Produtos</span><span>{mzn(subtotal)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Entrega</span><span className="text-primary">Grátis</span></div><div className="flex justify-between border-t border-border pt-3 text-lg font-bold"><span>Total</span><span>{mzn(total)}</span></div></div>
    <h3 className="mt-6 text-sm font-bold">Endereço de entrega</h3>
    {signedIn && addresses.length > 0 ? <select className={`${fieldCls} mt-2`} value={addrId} onChange={(e) => setAddrId(e.target.value)}>{addresses.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.address}</option>)}<option value="">Outro endereço…</option></select> : null}
    {(!addrId || addresses.length === 0) && <input className={`${fieldCls} mt-2`} placeholder="Bairro, rua, número, referência" value={manual} onChange={(e) => setManual(e.target.value)} />}
    {signedIn && <Link to="/conta/enderecos" className="mt-1 inline-block text-xs font-semibold text-primary">Gerir endereços</Link>}
    <textarea className="mt-3 w-full rounded-md border border-input bg-background p-3 text-sm" rows={2} placeholder="Nota para o operador (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
    <h3 className="mt-4 text-sm font-bold">Método de pagamento</h3>
    <div className="mt-2 grid grid-cols-2 gap-2">{([["mpesa", "M-Pesa"], ["emola", "e-Mola"], ["pos", "POS"], ["cash", "Dinheiro"]] as const).map(([value, label]) => <button key={value} onClick={() => setMethod(value)} className={`rounded-md border p-3 text-sm font-semibold transition ${method === value ? "border-primary bg-leaf-soft text-primary" : "border-border bg-background"}`}>{label}</button>)}</div>
    {notice && <p className="mt-3 text-sm text-destructive">{notice}</p>}
    <Button size="lg" className="mt-5 w-full" disabled={busy} onClick={() => void placeOrder()}>{busy ? "A enviar…" : signedIn ? "Finalizar encomenda" : "Entrar para finalizar"} <ChevronRight /></Button>
  </aside></div>}</main>;
}

function Orders({ orders, signedIn }: { orders: Order[]; signedIn: boolean }) { return <main className="mx-auto min-h-[calc(100vh-72px)] max-w-5xl px-4 pb-28 pt-8 sm:px-6"><PageTitle title="Minhas encomendas" subtitle="Acompanhe cada compra, da preparação à entrega." />{!signedIn ? <Empty icon={CircleUserRound} title="Entre na sua conta" text="Inicie sessão para consultar as suas encomendas." action="Entrar" to="/auth" /> : orders.length === 0 ? <Empty icon={Package} title="Ainda não há encomendas" text="A sua próxima cesta fresca começa no catálogo." action="Comprar agora" to="/produtos" /> : <div className="space-y-4">{orders.map((order) => <Link key={order.id} to="/encomendas/$id" params={{ id: order.id }} className="block rounded-lg border border-border bg-card p-5 transition hover:border-primary"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-xs text-muted-foreground">Encomenda #{order.order_number}</span><h2 className="mt-1 font-display text-xl">{statusLabel[order.status] ?? order.status}</h2></div><span className="rounded-full bg-leaf-soft px-3 py-1 text-xs font-bold text-primary">{order.payment_status === "paid" ? "Pago" : "Pagamento pendente"}</span></div><div className="mt-5 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-3"><span><Clock3 className="mr-2 inline h-4 w-4 text-muted-foreground" />{new Date(order.created_at).toLocaleDateString("pt-MZ")}</span><span className="truncate"><MapPin className="mr-2 inline h-4 w-4 text-muted-foreground" />{order.delivery_address}</span><strong className="sm:text-right">{mzn(order.total)}</strong></div></Link>)}</div>}</main>; }

type AccountLink = "/conta/perfil" | "/conta/enderecos" | "/conta/notificacoes" | "/definicoes" | "/ajuda" | "/termos" | "/privacidade" | "/admin" | "/operador" | "/encomendas";
function Account({ email, role, signOut }: { email: string | null; role: AppRole | null; signOut: () => void }) {
  const cards: Array<[typeof MapPin, string, string, AccountLink]> = [[CircleUserRound, "Perfil", "Nome, telefone e NUIT", "/conta/perfil"], [MapPin, "Endereços", "Gerir locais de entrega", "/conta/enderecos"], [Bell, "Notificações", "Atualizações das encomendas", "/conta/notificacoes"], [Package, "Encomendas", "Histórico e estado", "/encomendas"], [Settings, "Definições", "Palavra-passe e preferências", "/definicoes"], [Heart, "Ajuda", "Fale com a Horta Boa", "/ajuda"]];
  if (role === "operator" || role === "admin") cards.unshift([Truck, "Painel do operador", "Encomendas para entregar", "/operador"]);
  if (role === "admin") cards.unshift([BarChart3, "Gestão da loja", "Produtos, stock, vendas e utilizadores", "/admin"]);
  return <main className="mx-auto min-h-[calc(100vh-72px)] max-w-4xl px-4 pb-28 pt-8 sm:px-6"><PageTitle title="A sua conta" subtitle="Tudo o que precisa para gerir as suas compras." />{!email ? <Empty icon={CircleUserRound} title="Bem-vindo à Horta Boa" text="Entre ou crie uma conta para guardar endereços e acompanhar encomendas." action="Entrar ou registar" to="/auth" /> : <><section className="mb-6 flex items-center gap-4 rounded-lg bg-primary p-5 text-primary-foreground"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/15"><CircleUserRound /></div><div className="min-w-0"><span className="text-xs uppercase tracking-[.12em] text-primary-foreground/70">{role === "admin" ? "Administrador" : role === "operator" ? "Operador" : "Cliente Horta Boa"}</span><p className="truncate font-semibold">{email}</p></div></section><div className="grid gap-3 sm:grid-cols-2">{cards.map(([Icon, title, text, to]) => <Link key={title} to={to} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 text-left hover:border-primary"><span className="flex h-10 w-10 items-center justify-center rounded-md bg-leaf-soft text-primary"><Icon /></span><span className="flex-1"><strong className="block">{title}</strong><small className="text-muted-foreground">{text}</small></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>)}</div><Button variant="outline" className="mt-6" onClick={() => void signOut()}><LogOut /> Terminar sessão</Button></>}<p className="mt-8 flex gap-4 text-xs text-muted-foreground"><Link to="/termos" className="hover:text-primary">Termos</Link><Link to="/privacidade" className="hover:text-primary">Privacidade</Link><Link to="/ajuda" className="hover:text-primary">Ajuda</Link></p></main>;
}


function NavItem({ to, icon: Icon, label }: { to: "/" | "/produtos" | "/encomendas" | "/conta" | "/carrinho"; icon: typeof Home; label: string }) { return <Link to={to} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground" activeProps={{ className: "bg-leaf-soft text-primary" }}><Icon className="h-4 w-4" />{label}</Link>; }
function MobileNav({ count }: { count: number }) { return <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 px-1 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden"><MobileLink to="/" icon={Home} label="Início" /><MobileLink to="/produtos" icon={Sprout} label="Produtos" /><MobileLink to="/carrinho" icon={ShoppingCart} label="Cesto" badge={count} /><MobileLink to="/encomendas" icon={Package} label="Pedidos" /><MobileLink to="/conta" icon={CircleUserRound} label="Conta" /></nav>; }
function MobileLink({ to, icon: Icon, label, badge }: { to: "/" | "/produtos" | "/encomendas" | "/conta" | "/carrinho"; icon: typeof Home; label: string; badge?: number }) { return <Link to={to} className="relative flex min-w-0 flex-col items-center gap-1 py-1 text-[10px] font-semibold text-muted-foreground" activeProps={{ className: "text-primary" }}><Icon className="h-5 w-5" />{label}{Boolean(badge) && <span className="absolute right-[23%] -top-1 rounded-full bg-tomato px-1.5 text-[9px] text-tomato-foreground">{badge}</span>}</Link>; }
function Feature({ icon: Icon, title, text }: { icon: typeof Sprout; title: string; text: string }) { return <div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><Icon /></span><div><strong className="font-display text-lg">{title}</strong><p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p></div></div>; }
function RestrictedArea({ ready, signedIn }: { ready: boolean; signedIn: boolean }) { if (!ready) return <main className="flex min-h-[70vh] items-center justify-center"><span className="text-sm text-muted-foreground">A confirmar acesso…</span></main>; return <main className="mx-auto min-h-[70vh] max-w-lg px-5 py-20 text-center"><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-leaf-soft text-primary"><Settings className="h-9 w-9" /></span><h1 className="mt-5 font-display text-3xl">Área reservada</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{signedIn ? "A sua conta não tem permissão para aceder a esta área." : "Entre com uma conta autorizada para continuar."}</p><Button className="mt-6" asChild><Link to={signedIn ? "/" : "/auth"}>{signedIn ? "Voltar à loja" : "Entrar"}</Link></Button></main>; }
