import { createFileRoute } from "@tanstack/react-router";
import { HortaBoaApp } from "@/components/HortaBoaApp";
import { ProductDetail } from "@/components/pages/CustomerPages";
export const Route = createFileRoute("/produtos_/$id")({ head: () => ({ meta: [{ title: "Produto — Horta Boa" }, { name: "description", content: "Detalhe do produto Horta Boa." }, { property: "og:title", content: "Produto — Horta Boa" }, { property: "og:description", content: "Detalhe do produto Horta Boa." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: function P() { const { id } = Route.useParams(); return <HortaBoaApp view="page"><ProductDetail id={id} /></HortaBoaApp>; } });
