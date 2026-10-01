import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartProduct = { id: string; name: string; category: string; price: number; unitLabel: string; minQuantity: number; imageKey: string; stock: number };
export type CartLine = CartProduct & { quantity: number };

type StoreValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (product: CartProduct) => void;
  change: (id: string, delta: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("horta-boa-cart");
    if (saved) {
      try { setLines(JSON.parse(saved) as CartLine[]); } catch { setLines([]); }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem("horta-boa-cart", JSON.stringify(lines));
  }, [lines, ready]);

  const value = useMemo<StoreValue>(() => ({
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: lines.reduce((sum, line) => sum + line.price * line.minQuantity * line.quantity, 0),
    add: (product) => setLines((current) => {
      const found = current.find((line) => line.id === product.id);
      return found ? current.map((line) => line.id === product.id ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { ...product, quantity: 1 }];
    }),
    change: (id, delta) => setLines((current) => current.map((line) => line.id === id ? { ...line, quantity: Math.max(1, line.quantity + delta) } : line)),
    remove: (id) => setLines((current) => current.filter((line) => line.id !== id)),
    clear: () => setLines([]),
  }), [lines]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("StoreProvider em falta");
  return value;
}
