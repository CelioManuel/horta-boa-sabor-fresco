import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, Page, PageTitle, fieldCls, mzn } from "@/components/ui-bits";
import { stockState } from "@/components/AdminPanel";
import { photoClass } from "@/components/pages/CustomerPages";
import { filterCatalogue, homeCatalogue } from "@/lib/catalog";
import { loadVisibleProducts } from "@/lib/catalog-data";
import { productImageStyle } from "@/lib/product-images";
import { useStore } from "@/lib/store";

type Product = Awaited<ReturnType<typeof loadVisibleProducts>>[number];

export function ProductVariants({ family }: { family: string }) {
  const { add } = useStore();
  const [variants, setVariants] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setQuantity(1);
    setNotice("");
    void loadVisibleProducts().then((products) => {
      if (!active) return;
      const matching = filterCatalogue(products, "", "Todos", family);
      const original = homeCatalogue(matching)[0] ?? matching[0];
      setVariants(matching);
      setSelectedId(original?.id ?? "");
    }).catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [family]);

  if (loading) return <Page><p className="py-16 text-center text-sm text-muted-foreground">A carregar…</p></Page>;
  if (error) return <Page><Empty title="Não foi possível carregar os produtos" text="Tente novamente dentro de instantes." action="Ver produtos" to="/produtos" /></Page>;
  const product = variants.find((item) => item.id === selectedId);
  if (!product) return <Page><Empty title="Produto não encontrado" text="Não existem variantes disponíveis deste produto." action="Ver produtos" to="/produtos" /></Page>;

  const stock = stockState(product.stock);
  const selectVariant = (id: string) => { setSelectedId(id); setQuantity(1); setNotice(""); };
  const addToCart = () => {
    for (let i = 0; i < quantity; i++) add({ id: product.id, name: product.name, category: product.category, price: product.price, unitLabel: product.unit_label, minQuantity: product.min_quantity, imageKey: product.image_key, stock: product.stock });
    setNotice(`${product.name} adicionado ao carrinho`);
  };

  return <Page wide>
    <PageTitle back="/" title={product.name} subtitle={product.category} />
    <div className="grid items-start gap-8 md:grid-cols-2">
      <div role="img" aria-label={product.name} className={`product-photo rounded-lg ${photoClass(product.image_key)}`} style={productImageStyle(product.image_key)} />
      <div className="min-w-0">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${stock.cls}`}>{stock.label}</span>
        <p className="mt-4 font-display text-4xl text-primary">{mzn(product.price)}</p>
        <p className="text-sm text-muted-foreground">por {product.unit_label}</p>
        {product.description && <p className="mt-5 leading-7 text-muted-foreground">{product.description}</p>}
        <label className="mt-6 block text-sm font-semibold">Variante
          <select className={`${fieldCls} mt-2 font-normal`} value={selectedId} onChange={(event) => selectVariant(event.target.value)}>
            {variants.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.unit_label}</option>)}
          </select>
        </label>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center rounded-md border border-input">
            <Button variant="ghost" size="icon" disabled={quantity <= 1} aria-label="Menos" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus /></Button>
            <span className="w-10 text-center font-bold">{quantity}</span>
            <Button variant="ghost" size="icon" disabled={product.stock <= quantity} aria-label="Mais" onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}><Plus /></Button>
          </div>
          <strong>{mzn(product.price * product.min_quantity * quantity)}</strong>
        </div>
        <Button size="lg" className="mt-6 w-full sm:w-auto" disabled={product.stock <= 0} onClick={addToCart}><ShoppingBasket /> Adicionar ao carrinho</Button>
        {notice && <p role="status" className="mt-3 text-sm text-primary">{notice}</p>}
      </div>
    </div>
    <section className="mt-12">
      <h2 className="font-display text-2xl">Todas as variantes ({variants.length})</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {variants.map((item) => <article key={item.id} className={`overflow-hidden rounded-lg border bg-card ${selectedId === item.id ? "border-primary" : "border-border"}`}>
          <Button variant="ghost" className="block h-auto w-full rounded-none p-0" aria-label={`Selecionar ${item.name}, ${item.unit_label}`} onClick={() => selectVariant(item.id)}>
            <span className={`product-photo block w-full ${photoClass(item.image_key)}`} style={productImageStyle(item.image_key)} />
          </Button>
          <div className="p-3 sm:p-4">
            <h3 className="min-h-10 font-display text-lg leading-5">{item.name}</h3>
            <p className="mt-2 text-xs text-muted-foreground">{item.unit_label}</p>
            <strong className="mt-2 block text-primary">{mzn(item.price)}</strong>
            <Button className="mt-3 w-full" size="sm" variant={selectedId === item.id ? "default" : "outline"} aria-pressed={selectedId === item.id} onClick={() => selectVariant(item.id)}>{selectedId === item.id ? "Selecionado" : "Selecionar"}</Button>
          </div>
        </article>)}
      </div>
    </section>
  </Page>;
}