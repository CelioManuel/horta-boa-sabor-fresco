import { createFileRoute } from "@tanstack/react-router";
import { HortaBoaApp } from "@/components/HortaBoaApp";
import { ProductVariants } from "@/components/pages/ProductVariants";

export const Route = createFileRoute("/produtos_/variantes/$familia")({
  head: ({ params }) => ({ meta: [
    { title: `Variantes de ${params.familia} — Horta Boa` },
    { name: "description", content: `Escolha todas as variedades e embalagens de ${params.familia} da Horta Boa.` },
    { property: "og:title", content: `Variantes de ${params.familia} — Horta Boa` },
    { property: "og:description", content: `Compare variedades e embalagens de ${params.familia} e adicione ao carrinho.` },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: VariantsPage,
});

function VariantsPage() {
  const { familia } = Route.useParams();
  return <HortaBoaApp view="page"><ProductVariants family={familia} /></HortaBoaApp>;
}