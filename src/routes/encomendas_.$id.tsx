import { createFileRoute } from "@tanstack/react-router";
import { HortaBoaApp } from "@/components/HortaBoaApp";
import { OrderDetail } from "@/components/pages/CustomerPages";
export const Route = createFileRoute("/encomendas/$id")({ head: () => ({ meta: [{ title: "Encomenda — Horta Boa" }, { name: "description", content: "Detalhe e estado da encomenda." }, { property: "og:title", content: "Encomenda — Horta Boa" }, { property: "og:description", content: "Detalhe e estado da encomenda." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: function P() { const { id } = Route.useParams(); return <HortaBoaApp view="page"><OrderDetail id={id} /></HortaBoaApp>; } });
