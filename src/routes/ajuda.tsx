import { createFileRoute } from "@tanstack/react-router";
import { HortaBoaApp } from "@/components/HortaBoaApp";
import { HelpPage } from "@/components/pages/SupportPages";
export const Route = createFileRoute("/ajuda")({ head: () => ({ meta: [{ title: "Ajuda — Horta Boa" }, { name: "description", content: "Perguntas frequentes e contactos da Horta Boa." }, { property: "og:title", content: "Ajuda — Horta Boa" }, { property: "og:description", content: "Perguntas frequentes e contactos da Horta Boa." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: () => <HortaBoaApp view="page"><HelpPage /></HortaBoaApp> });
