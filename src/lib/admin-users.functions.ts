import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createAccountInput, profileInput, protectOwnAdmin, requireAdminRole } from "@/lib/admin-users";

const requireAdministrator = createMiddleware({ type: "function" }).middleware([requireSupabaseAuth]).server(async ({ context, next }) => {
  const { data, error } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  if (error) throw new Error("Não foi possível confirmar as permissões.");
  requireAdminRole((data ?? []).map((r) => r.role));
  return next();
});

export const listAccounts = createServerFn({ method: "POST" }).middleware([requireAdministrator]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: profiles, error: pe }, { data: roles, error: re }] = await Promise.all([
    context.supabase.from("profiles").select("id,full_name,phone,nuit"),
    context.supabase.from("user_roles").select("user_id,role"),
  ]);
  if (pe || re) throw new Error("Não foi possível carregar os perfis.");
  const accounts: Array<{ id: string; email: string; full_name: string; phone: string; nuit: string; roles: Array<"customer" | "operator" | "admin">; confirmed: boolean }> = [];
  for (let page = 1; ; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error("Não foi possível carregar os utilizadores.");
    for (const user of data.users) {
      const profile = profiles?.find((p) => p.id === user.id);
      accounts.push({ id: user.id, email: user.email ?? "", full_name: profile?.full_name ?? "", phone: profile?.phone ?? user.phone ?? "", nuit: profile?.nuit ?? "", roles: (roles ?? []).filter((r) => r.user_id === user.id).map((r) => r.role), confirmed: Boolean(user.email_confirmed_at || user.phone_confirmed_at) });
    }
    if (data.users.length < 200) break;
  }
  return accounts;
});

export const saveAccount = createServerFn({ method: "POST" }).middleware([requireAdministrator]).inputValidator((input: unknown) => profileInput.parse(input)).handler(async ({ data, context }) => {
  protectOwnAdmin(context.userId, data.id, data.roles);
  const { error } = await context.supabase.rpc("admin_save_profile_roles", { target_id: data.id, target_name: data.full_name, target_phone: data.phone, target_nuit: data.nuit, target_roles: data.roles });
  if (error) throw new Error("Não foi possível guardar o perfil e as permissões.");
  return { ok: true };
});

export const createAccount = createServerFn({ method: "POST" }).middleware([requireAdministrator]).inputValidator((input: unknown) => createAccountInput.parse(input)).handler(async ({ data, context }) => {
  const request = getRequest();
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  if (new URL(data.redirectTo).origin !== origin) throw new Error("Endereço de confirmação inválido.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({ email: data.email, password: data.password, email_confirm: false, user_metadata: { full_name: data.full_name } });
  if (error || !created.user) throw new Error("Não foi possível criar a conta. Verifique o email e se a conta já existe.");
  const id = created.user.id;
  const { error: profileError } = await context.supabase.rpc("admin_save_profile_roles", { target_id: id, target_name: data.full_name, target_phone: data.phone, target_nuit: data.nuit, target_roles: data.roles });
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(id);
    throw new Error("Não foi possível concluir a criação do perfil. Tente novamente.");
  }
  const { error: emailError } = await supabaseAdmin.auth.resend({ type: "signup", email: data.email, options: { emailRedirectTo: `${origin}/auth` } });
  return { ok: true, emailSent: !emailError };
});