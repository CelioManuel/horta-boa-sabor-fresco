import { createFileRoute } from "@tanstack/react-router";
import { HortaBoaApp } from "@/components/HortaBoaApp";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Horta Boa — Hortícolas frescos em Maputo" },
    { name: "description", content: "Compre tomate, batata, cenoura, cebola e outros hortícolas frescos com entrega em Maputo." },
    { property: "og:title", content: "Horta Boa — Fresco todos os dias" },
    { property: "og:description", content: "Produtos hortícolas locais, selecionados e entregues à sua porta." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  return <HortaBoaApp view="catalog" />;
}
