import { createFileRoute } from "@tanstack/react-router";
import { HortaBoaApp } from "@/components/HortaBoaApp";
import { PrivacyPage } from "@/components/pages/SupportPages";
export const Route = createFileRoute("/privacidade")({ head: () => ({ meta: [{ title: "Privacidade — Horta Boa" }, { name: "description", content: "Como a Horta Boa trata os seus dados." }, { property: "og:title", content: "Privacidade — Horta Boa" }, { property: "og:description", content: "Como a Horta Boa trata os seus dados." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: () => <HortaBoaApp view="page"><PrivacyPage /></HortaBoaApp> });
