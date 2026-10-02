import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Leaf, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/horta-boa-mark.png";

export const Route = createFileRoute("/auth")({ head: () => ({ meta: [{ title: "Entrar — Horta Boa" }, { name: "description", content: "Entre ou crie a sua conta Horta Boa." }, { property: "og:title", content: "Entrar — Horta Boa" }, { property: "og:description", content: "Aceda às suas encomendas e entregas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [signup, setSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    if (signup) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name } } });
      if (error) setMessage(error.message); else if (data.user) setMessage("Confirme o email que enviámos para concluir o registo.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage("Email ou palavra-passe incorretos."); else {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const fullName = typeof data.user.user_metadata.full_name === "string" ? data.user.user_metadata.full_name : "";
          await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName });
          await supabase.from("user_roles").upsert({ user_id: data.user.id, role: "customer" }, { onConflict: "user_id,role" });
        }
        await navigate({ to: "/produtos" });
      }
    }
    setBusy(false);
  }
  return <main className="grid min-h-screen bg-leaf-soft lg:grid-cols-2"><section className="relative hidden overflow-hidden bg-primary lg:block"><img src="/src/assets/horta-boa-hero.jpg" alt="Hortícolas frescos" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-hero-overlay" /><div className="relative flex h-full items-end p-12 text-primary-foreground"><div><Leaf className="mb-4 h-8 w-8 text-harvest" /><h1 className="font-display text-5xl">Fresco começa aqui.</h1><p className="mt-3 max-w-md text-primary-foreground/80">Crie a sua conta e acompanhe cada cesta, da colheita à sua porta.</p></div></div></section><section className="flex items-center justify-center p-5"><div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl sm:p-8"><Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft /> Voltar</Link></Button><div className="mt-5 flex items-center gap-3"><img src={logo} alt="" className="h-12 w-12" width={1024} height={1024} /><div><span className="font-display text-2xl text-primary">Horta Boa</span><p className="text-xs text-muted-foreground">Fresco da nossa terra</p></div></div><h2 className="mt-8 font-display text-3xl">{signup ? "Criar conta" : "Bem-vindo de volta"}</h2><p className="mt-1 text-sm text-muted-foreground">{signup ? "Registe-se para encomendar e acompanhar entregas." : "Entre para continuar as suas compras."}</p><form className="mt-6 space-y-4" onSubmit={submit}>{signup && <label className="block text-sm font-semibold">Nome completo<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label>}<label className="block text-sm font-semibold">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label><label className="block text-sm font-semibold">Palavra-passe<input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label>{message && <p className="rounded-md bg-muted p-3 text-sm">{message}</p>}<Button size="lg" className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}{signup ? "Criar conta" : "Entrar"}</Button></form><button className="mt-5 w-full text-center text-sm font-semibold text-primary" onClick={() => { setSignup(!signup); setMessage(""); }}>{signup ? "Já tem conta? Entrar" : "Ainda não tem conta? Registar"}</button></div></section></main>;
}