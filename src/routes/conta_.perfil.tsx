import { createFileRoute } from "@tanstack/react-router";
import { HortaBoaApp } from "@/components/HortaBoaApp";
import { Profile } from "@/components/pages/CustomerPages";
export const Route = createFileRoute("/conta_/perfil")({ head: () => ({ meta: [{ title: "Perfil — Horta Boa" }, { name: "description", content: "Os seus dados na Horta Boa." }, { property: "og:title", content: "Perfil — Horta Boa" }, { property: "og:description", content: "Os seus dados na Horta Boa." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: () => <HortaBoaApp view="page"><Profile /></HortaBoaApp> });
