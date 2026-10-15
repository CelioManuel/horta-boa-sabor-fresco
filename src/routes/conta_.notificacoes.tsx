import { createFileRoute } from "@tanstack/react-router";
import { HortaBoaApp } from "@/components/HortaBoaApp";
import { Notifications } from "@/components/pages/CustomerPages";
export const Route = createFileRoute("/conta/notificacoes")({ head: () => ({ meta: [{ title: "Notificações — Horta Boa" }, { name: "description", content: "Atualizações das suas encomendas." }, { property: "og:title", content: "Notificações — Horta Boa" }, { property: "og:description", content: "Atualizações das suas encomendas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: () => <HortaBoaApp view="page"><Notifications /></HortaBoaApp> });
