import { productImageStyle } from "@/lib/product-images";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, BarChart3, Bell, Check, ChevronRight, CircleUserRound, Clock3,
  Heart, Home, Leaf, LogOut, MapPin, Menu, Minus, Package, Plus, Search,
  Settings, ShoppingBasket, ShoppingCart, Sprout, Store, Tag, Trash2, Truck, Users, X
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

export function HortaBoaApp({ view, children }: { view: View; children?: React.ReactNode }) {
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
      setUserEmail(data.user?.email ?? null);
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
  const visible = useMemo(() => products.filter((product) => (category === "Todos" || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase())), [products, query, category]);
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

      {view === "catalog" && <Catalog products={visible} allProducts={products} categories={categories} category={category} setCategory={setCategory} query={query} setQuery={setQuery} add={(product) => { add(asCartProduct(product)); setNotice(`${product.name} adicionado ao carrinho`); }} />}
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

function Catalog({ products, allProducts, categories, category, setCategory, query, setQuery, add }: { products: DbProduct[]; allProducts: DbProduct[]; categories: string[]; category: string; setCategory: (v: string) => void; query: string; setQuery: (v: string) => void; add: (product: DbProduct) => void }) {
  return <main className="pb-28">
    <section className="relative min-h-[520px] overflow-hidden bg-forest text-primary-foreground sm:min-h-[590px]">
      <img src={heroImage} alt="Cesto com hortícolas frescos numa machamba" className="absolute inset-0 h-full w-full object-cover" width={1600} height={912} />
      <div className="absolute inset-0 bg-hero-overlay" />
      <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-end px-5 pb-12 pt-24 sm:min-h-[590px] sm:px-8 sm:pb-16">
        <div className="max-w-xl"><span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em]"><Leaf className="h-3.5 w-3.5" /> Da machamba para si</span><h1 className="font-display text-5xl leading-[.95] sm:text-7xl">Fresco. Local.<br />Todos os dias.</h1><p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/85 sm:text-lg">Os melhores hortícolas, selecionados com cuidado e entregues à sua porta em Maputo.</p><div className="mt-7 flex flex-wrap gap-3"><Button size="lg" variant="harvest" asChild><a href="#catalogo">Comprar agora <ChevronRight /></a></Button><span className="flex items-center gap-2 text-sm font-semibold"><Truck className="h-5 w-5 text-harvest" /> Entrega desde 150 MZN</span></div></div>
      </div>
    </section>
    <section id="catalogo" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><span className="text-xs font-bold uppercase tracking-[.16em] text-tomato">Colheita de hoje</span><h2 className="mt-1 font-display text-3xl sm:text-4xl">Escolha o mais fresco</h2><p className="mt-2 text-sm text-muted-foreground">{allProducts.length} produtos disponíveis na nossa loja.</p></div><label className="flex h-11 w-full items-center gap-2 rounded-md border border-input bg-card px-3 sm:w-80"><Search className="h-4 w-4 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar hortícolas" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label></div>
      <div className="hide-scrollbar mb-7 flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <Button key={item} variant={category === item ? "default" : "outline"} size="sm" onClick={() => setCategory(item)}>{item}</Button>)}</div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{products.map((product) => <article key={product.id} className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><Link to="/produtos/$id" params={{ id: product.id }} className={`product-photo block ${productPositions[product.image_key] ?? "product-generic"}`} style={productImageStyle(product.image_key)}>{product.is_featured && <span className="absolute left-2 top-2 rounded-full bg-harvest px-2 py-1 text-[10px] font-bold uppercase text-harvest-foreground">Popular</span>}</Link><div className="p-3 sm:p-4"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{product.category}</span><Link to="/produtos/$id" params={{ id: product.id }}><h3 className="mt-1 min-h-10 font-display text-lg leading-5 hover:text-primary">{product.name}</h3></Link><p className="mt-2 hidden text-xs leading-5 text-muted-foreground sm:block">{product.description}</p><div className="mt-4 flex items-end justify-between gap-2"><div><strong className="text-lg text-primary">{product.price.toLocaleString("pt-MZ")} MZN</strong><span className="block text-[11px] text-muted-foreground">por {product.min_quantity === 1 ? product.unit_label : `${product.min_quantity} ${product.unit_label}`}</span></div><Button size="icon" disabled={product.stock <= 0} onClick={() => add(product)} aria-label={`Adicionar ${product.name}`}><Plus /></Button></div><span className={`mt-3 inline-block rounded-full px-2 py-1 text-[11px] font-bold ${stockState(product.stock).cls}`}>{stockState(product.stock).label}</span></div></article>)}</div>
    </section>
    <section className="border-y border-border bg-leaf-soft"><div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:grid-cols-3 sm:px-6"><Feature icon={Sprout} title="Colheita selecionada" text="Escolhemos produtos frescos de produtores locais." /><Feature icon={Truck} title="Entrega rápida" text="Receba a sua encomenda sem sair de casa." /><Feature icon={Check} title="Qualidade garantida" text="Se não estiver fresco, fazemos a substituição." /></div></section>
  </main>;
}

CART_ORDERS_ACCOUNT

function NavItem({ to, icon: Icon, label }: { to: "/" | "/produtos" | "/encomendas" | "/conta" | "/carrinho"; icon: typeof Home; label: string }) { return <Link to={to} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground" activeProps={{ className: "bg-leaf-soft text-primary" }}><Icon className="h-4 w-4" />{label}</Link>; }
function MobileNav({ count }: { count: number }) { return <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 px-1 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden"><MobileLink to="/" icon={Home} label="Início" /><MobileLink to="/produtos" icon={Sprout} label="Produtos" /><MobileLink to="/carrinho" icon={ShoppingCart} label="Cesto" badge={count} /><MobileLink to="/encomendas" icon={Package} label="Pedidos" /><MobileLink to="/conta" icon={CircleUserRound} label="Conta" /></nav>; }
function MobileLink({ to, icon: Icon, label, badge }: { to: "/" | "/produtos" | "/encomendas" | "/conta" | "/carrinho"; icon: typeof Home; label: string; badge?: number }) { return <Link to={to} className="relative flex min-w-0 flex-col items-center gap-1 py-1 text-[10px] font-semibold text-muted-foreground" activeProps={{ className: "text-primary" }}><Icon className="h-5 w-5" />{label}{Boolean(badge) && <span className="absolute right-[23%] -top-1 rounded-full bg-tomato px-1.5 text-[9px] text-tomato-foreground">{badge}</span>}</Link>; }
function Feature({ icon: Icon, title, text }: { icon: typeof Sprout; title: string; text: string }) { return <div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><Icon /></span><div><strong className="font-display text-lg">{title}</strong><p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p></div></div>; }
function RestrictedArea({ ready, signedIn }: { ready: boolean; signedIn: boolean }) { if (!ready) return <main className="flex min-h-[70vh] items-center justify-center"><span className="text-sm text-muted-foreground">A confirmar acesso…</span></main>; return <main className="mx-auto min-h-[70vh] max-w-lg px-5 py-20 text-center"><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-leaf-soft text-primary"><Settings className="h-9 w-9" /></span><h1 className="mt-5 font-display text-3xl">Área reservada</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{signedIn ? "A sua conta não tem permissão para aceder a esta área." : "Entre com uma conta autorizada para continuar."}</p><Button className="mt-6" asChild><Link to={signedIn ? "/" : "/auth"}>{signedIn ? "Voltar à loja" : "Entrar"}</Link></Button></main>; }
