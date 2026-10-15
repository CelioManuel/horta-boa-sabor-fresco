import { createFileRoute } from "@tanstack/react-router";
import { HortaBoaApp } from "@/components/HortaBoaApp";
import { TermsPage } from "@/components/pages/SupportPages";
export const Route = createFileRoute("/termos")({ head: () => ({ meta: [{ title: "Termos e condições — Horta Boa" }, { name: "description", content: "Condições de compra na Horta Boa." }, { property: "og:title", content: "Termos e condições — Horta Boa" }, { property: "og:description", content: "Condições de compra na Horta Boa." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: () => <HortaBoaApp view="page"><TermsPage /></HortaBoaApp> });
