import { createFileRoute } from "@tanstack/react-router";
import { HortaBoaApp } from "@/components/HortaBoaApp";
import { Addresses } from "@/components/pages/CustomerPages";
export const Route = createFileRoute("/conta_/enderecos")({ head: () => ({ meta: [{ title: "Endereços — Horta Boa" }, { name: "description", content: "Gerir os endereços de entrega." }, { property: "og:title", content: "Endereços — Horta Boa" }, { property: "og:description", content: "Gerir os endereços de entrega." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: () => <HortaBoaApp view="page"><Addresses /></HortaBoaApp> });
