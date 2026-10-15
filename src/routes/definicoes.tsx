import { createFileRoute } from "@tanstack/react-router";
import { HortaBoaApp } from "@/components/HortaBoaApp";
import { SettingsPage } from "@/components/pages/CustomerPages";
export const Route = createFileRoute("/definicoes")({ head: () => ({ meta: [{ title: "Definições — Horta Boa" }, { name: "description", content: "Segurança e preferências da conta." }, { property: "og:title", content: "Definições — Horta Boa" }, { property: "og:description", content: "Segurança e preferências da conta." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: () => <HortaBoaApp view="page"><SettingsPage /></HortaBoaApp> });
