import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { canOpenPage, primaryRole, type AppRole } from "@/lib/access";

type Identity = { ready: boolean; email: string | null; role: AppRole | null; error: boolean };
const AccessContext = createContext<Identity>({ ready: false, email: null, role: null, error: false });
export const useAccess = () => useContext(AccessContext);

export function AccessProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity>({ ready: false, email: null, role: null, error: false });
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    let active = true;
    let version = 0;
    const refresh = async () => {
      const request = ++version;
      const { data, error } = await supabase.auth.getUser();
      if (!active || request !== version) return;
      if (!data.user) {
        setIdentity({ ready: true, email: null, role: null, error: false });
        return;
      }
      const { data: rows, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      if (!active || request !== version) return;
      setIdentity({ ready: true, email: data.user.email || data.user.phone || null, role: roleError ? null : primaryRole((rows ?? []).map((row) => row.role)), error: Boolean(error || roleError) });
    };
    void refresh();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setIdentity({ ready: false, email: null, role: null, error: false });
      setTimeout(() => { if (active) void refresh(); }, 0);
    });
    return () => { active = false; version++; listener.subscription.unsubscribe(); };
  }, []);

  if (!identity.ready) return <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"><p role="status">A confirmar acesso…</p></main>;
  if (identity.error) return <main className="flex min-h-screen items-center justify-center bg-background text-foreground"><p role="alert">Não foi possível confirmar as permissões. Atualize a página para tentar novamente.</p></main>;
  if (!canOpenPage(identity.role, pathname)) return <Navigate to="/operador" replace />;
  return <AccessContext.Provider value={identity}>{children}</AccessContext.Provider>;
}