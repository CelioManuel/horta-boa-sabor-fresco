import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Leaf, Loader2, Mail, Phone, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone } from "@/lib/phone";
import logo from "@/assets/horta-boa-mark.png";
import hero from "@/assets/horta-boa-hero.jpg";
import { fieldCls } from "@/components/ui-bits";

export const Route = createFileRoute("/auth")({ head: () => ({ meta: [{ title: "Entrar — Horta Boa" }, { name: "description", content: "Entre ou registe-se na Horta Boa com email ou telemóvel." }, { property: "og:title", content: "Entrar — Horta Boa" }, { property: "og:description", content: "Aceda às suas encomendas com email ou número de telemóvel." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [signup, setSignup] = useState(false);
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);

  async function finishLogin() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Não foi possível confirmar a sua sessão.");
    const fullName = typeof data.user.user_metadata["full_name"] === "string" ? data.user.user_metadata["full_name"] : "";
    // Only initialize missing rows; never overwrite a profile on subsequent login.
    const { error: profileError } = await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName, phone: data.user.phone ?? "" }, { onConflict: "id", ignoreDuplicates: true });
    const { error: roleError } = await supabase.from("user_roles").upsert({ user_id: data.user.id, role: "customer" }, { onConflict: "user_id,role", ignoreDuplicates: true });
    if (profileError || roleError) throw new Error("A sessão foi iniciada, mas não foi possível preparar a conta. Tente entrar novamente.");
    setPassword("");
    await navigate({ to: "/produtos" });
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      if (pendingPhone) {
        const { error } = await supabase.auth.verifyOtp({ phone: pendingPhone, token: otp.trim(), type: "sms" });
        if (error) throw new Error("Código inválido ou expirado. Verifique o SMS ou peça outro código.");
        await finishLogin();
      } else if (signup) {
        const credentials = mode === "phone" ? { phone: normalizePhone(phone), password, options: { channel: "sms" as const, data: { full_name: name.trim() } } } : { email: email.trim(), password, options: { emailRedirectTo: window.location.origin, data: { full_name: name.trim() } } };
        const { data, error } = await supabase.auth.signUp(credentials);
        if (error) throw error;
        if (mode === "phone") {
          setPendingPhone(normalizePhone(phone)); setResendAt(Date.now() + 60000); setPassword("");
          setMessage("Enviámos um código por SMS para confirmar o seu número.");
        } else if (data.session) await finishLogin();
        else { setPassword(""); setMessage("Confirme o email que enviámos para concluir o registo."); }
      } else {
        const credentials = mode === "phone" ? { phone: normalizePhone(phone), password } : { email: email.trim(), password };
        const { error } = await supabase.auth.signInWithPassword(credentials);
        if (error) throw new Error("Dados de entrada incorretos ou conta ainda não confirmada.");
        await finishLogin();
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Não foi possível concluir. Tente novamente.";
      setMessage(/phone provider|phone logins|sms provider|unsupported phone|signups not allowed.*phone/i.test(text) ? "O registo por telemóvel ainda não está disponível. Pode registar-se por email." : text);
    } finally { setBusy(false); }
  }
  async function resend() {
    if (Date.now() < resendAt) { setMessage("Aguarde um minuto antes de pedir outro código."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({ type: "sms", phone: pendingPhone });
      if (error) throw error;
      setResendAt(Date.now() + 60000); setMessage("Novo código enviado por SMS.");
    } catch { setMessage("Não foi possível reenviar o SMS. Tente mais tarde."); }
    finally { setBusy(false); }
  }
  function reset() { setPendingPhone(""); setOtp(""); setPassword(""); setMessage(""); }

  return <main className="grid min-h-screen bg-leaf-soft lg:grid-cols-2">
    <section className="relative hidden overflow-hidden bg-primary lg:block"><img src={hero} alt="Hortícolas frescos" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-hero-overlay" /><div className="relative flex h-full items-end p-12 text-primary-foreground"><div><Leaf className="mb-4 h-8 w-8 text-harvest" /><h1 className="font-display text-5xl">Fresco começa aqui.</h1><p className="mt-3 max-w-md text-primary-foreground/80">Da colheita à sua porta, com entrega gratuita.</p></div></div></section>
    <section className="flex items-center justify-center p-5"><div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl sm:p-8">
      <Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft /> Voltar</Link></Button>
      <div className="mt-5 flex items-center gap-3"><img src={logo} alt="" className="h-12 w-12" width={1024} height={1024} /><div><span className="font-display text-2xl text-primary">Horta Boa</span><p className="text-xs text-muted-foreground">Fresco da nossa terra</p></div></div>
      <h2 className="mt-8 font-display text-3xl">{pendingPhone ? "Confirmar telemóvel" : signup ? "Criar conta" : "Bem-vindo de volta"}</h2>
      {!pendingPhone && <div className="mt-5 grid grid-cols-2 gap-2" role="group" aria-label="Método de registo"><Button type="button" variant={mode === "email" ? "default" : "outline"} aria-pressed={mode === "email"} onClick={() => { setMode("email"); reset(); }}><Mail /> Email</Button><Button type="button" variant={mode === "phone" ? "default" : "outline"} aria-pressed={mode === "phone"} onClick={() => { setMode("phone"); reset(); }}><Phone /> Telemóvel</Button></div>}
      <form className="mt-6 space-y-4" onSubmit={submit}>
        {pendingPhone ? <><p className="text-sm text-muted-foreground">{pendingPhone}</p><label className="block text-sm font-semibold">Código SMS<input required pattern="[0-9]{6}" maxLength={6} inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className={fieldCls} /></label></> : <>
          {signup && <label className="block text-sm font-semibold">Nome completo<input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={fieldCls} /></label>}
          {mode === "email" ? <label className="block text-sm font-semibold">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} /></label> : <label className="block text-sm font-semibold">Número de telemóvel<input required type="tel" autoComplete="tel" placeholder="+258 84 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldCls} /></label>}
          <label className="block text-sm font-semibold">Palavra-passe<input required minLength={6} type="password" autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className={fieldCls} /></label>
        </>}
        {message && <p role="status" className="rounded-md bg-muted p-3 text-sm">{message}</p>}
        <Button size="lg" className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}{pendingPhone ? "Confirmar número" : signup ? "Criar conta" : "Entrar"}</Button>
      </form>
      {pendingPhone ? <div className="mt-4 flex flex-wrap gap-2"><Button variant="ghost" disabled={busy} onClick={() => void resend()}><RefreshCw /> Reenviar código</Button><Button variant="ghost" disabled={busy} onClick={reset}><ArrowLeft /> Alterar número</Button></div> : <Button variant="link" className="mt-5 h-auto w-full whitespace-normal" disabled={busy} onClick={() => { setSignup(!signup); reset(); }}>{signup ? "Já tem conta? Entrar" : "Ainda não tem conta? Registar"}</Button>}
    </div></section>
  </main>;
}
