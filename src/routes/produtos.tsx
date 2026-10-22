import { createFileRoute } from "@tanstack/react-router";
import { HortaBoaApp } from "@/components/HortaBoaApp";
export const Route = createFileRoute("/produtos")({ validateSearch: (search: Record<string, unknown>): { familia?: string } => ({ familia: typeof search['familia'] === "string" ? search['familia'] : undefined }), head: () => ({ meta: [{ title: "Produtos — Horta Boa" }, { name: "description", content: "Catálogo completo e variantes dos hortícolas frescos da Horta Boa." }, { property: "og:title", content: "Produtos frescos — Horta Boa" }, { property: "og:description", content: "Escolha hortícolas frescos e receba em casa." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: Products });

function Products() {
  const { familia } = Route.useSearch();
  return <HortaBoaApp view="catalog" catalogMode="products" family={familia} />;
}