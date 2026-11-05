import { useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Entry = { id: string; actor_id: string | null; category: string; action: string; summary: string; created_at: string };
const categories: Array<[string, string]> = [["all", "Tudo"], ["orders", "Encomendas"], ["products", "Produtos e preços"], ["users", "Utilizadores"], ["session", "Entradas no sistema"]];

export function AuditLog() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("audit_logs").select("id,actor_id,category,action,summary,created_at").order("created_at", { ascending: false }).limit(300);
    if (cat !== "all") q = q.eq("category", cat);
    const { data } = await q;
    const rows = data ?? [];
    setEntries(rows);
    const ids = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
    if (ids.length) {
      const { data: prof } = await supabase.from("profiles").select("id,full_name").in("id", ids);
      setNames(Object.fromEntries((prof ?? []).map((p) => [p.id, p.full_name])));
    }
    setLoading(false);
  };
  useEffect(() => { void load(); }, [cat]);

  const shown = entries.filter((e) => e.summary.toLowerCase().includes(query.toLowerCase()));
  return <section className="mt-5 space-y-3">
    <div className="flex flex-wrap gap-2">
      {categories.map(([k, l]) => <Button key={k} size="sm" variant={cat === k ? "default" : "outline"} onClick={() => setCat(k)}>{l}</Button>)}
      <Button size="sm" variant="ghost" onClick={() => void load()}><RefreshCw /> Atualizar</Button>
    </div>
    <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-card px-3"><Search className="h-4 w-4 text-muted-foreground" /><input className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Pesquisar no histórico" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {loading ? <p className="p-4 text-sm text-muted-foreground">A carregar histórico…</p> : shown.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Sem registos.</p> : shown.map((e) => <div key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border p-3 last:border-0">
        <time className="w-36 shrink-0 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-MZ")}</time>
        <span className="min-w-0 flex-1 text-sm">{e.summary}</span>
        <small className="text-xs text-muted-foreground">{e.actor_id ? names[e.actor_id] || "Utilizador" : "Sistema"}</small>
      </div>)}
    </div>
  </section>;
}
