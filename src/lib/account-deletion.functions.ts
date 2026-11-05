import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canApproveDeletion, checkDeletionRequest } from "@/lib/account-deletion";

const requireAdministrator = createMiddleware({ type: "function" }).middleware([requireSupabaseAuth]).server(async ({ context, next }) => {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  if (!(data ?? []).some((r) => r.role === "admin")) throw new Error("Apenas administradores.");
  return next();
});

export const requestAccountDeletion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ confirm: z.string().max(40), reason: z.string().max(500) }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: orders } = await context.supabase.from("orders").select("status").eq("user_id", context.userId);
    const problem = checkDeletionRequest({ ...data, orderStatuses: (orders ?? []).map((o) => o.status) });
    if (problem) throw new Error(problem);
    const { error } = await context.supabase.from("account_deletion_requests").insert({ user_id: context.userId, reason: data.reason.trim() });
    if (error) throw new Error("Já tem um pedido pendente ou não foi possível registar o pedido.");
    return { ok: true };
  });

export const listDeletionRequests = createServerFn({ method: "POST" }).middleware([requireAdministrator]).handler(async ({ context }) => {
  const { data: reqs, error } = await context.supabase.from("account_deletion_requests").select("id,user_id,reason,status,created_at").eq("status", "pending").order("created_at");
  if (error) throw new Error("Não foi possível carregar os pedidos.");
  const ids = (reqs ?? []).map((r) => r.user_id);
  if (!ids.length) return [];
  const [{ data: profiles }, { data: orders }] = await Promise.all([
    context.supabase.from("profiles").select("id,full_name,phone").in("id", ids),
    context.supabase.from("orders").select("user_id,status").in("user_id", ids),
  ]);
  return (reqs ?? []).map((r) => {
    const p = profiles?.find((x) => x.id === r.user_id);
    const st = (orders ?? []).filter((o) => o.user_id === r.user_id).map((o) => o.status as string);
    return { ...r, full_name: p?.full_name ?? "", phone: p?.phone ?? "", total_orders: st.length, active_orders: st.filter((s) => !["delivered", "cancelled"].includes(s)).length };
  });
});

export const reviewDeletionRequest = createServerFn({ method: "POST" }).middleware([requireAdministrator])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), approve: z.boolean(), note: z.string().max(500).default("") }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: req } = await context.supabase.from("account_deletion_requests").select("user_id,status").eq("id", data.id).maybeSingle();
    if (!req || req.status !== "pending") throw new Error("Pedido já não está pendente.");
    if (req.user_id === context.userId) throw new Error("Não pode aprovar a eliminação da sua própria conta.");
    const review = { reviewed_by: context.userId, reviewed_at: new Date().toISOString(), admin_note: data.note || null };
    if (!data.approve) {
      await context.supabase.from("account_deletion_requests").update({ ...review, status: "rejected" }).eq("id", data.id);
      return { ok: true };
    }
    const { data: orders } = await context.supabase.from("orders").select("status").eq("user_id", req.user_id);
    if (!canApproveDeletion((orders ?? []).map((o) => o.status))) throw new Error("O cliente tem encomendas em curso.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_addresses").delete().eq("user_id", req.user_id);
    await supabaseAdmin.from("notifications").delete().eq("user_id", req.user_id);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", req.user_id);
    await supabaseAdmin.from("profiles").delete().eq("id", req.user_id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.user_id);
    if (error) throw new Error("Não foi possível eliminar a conta.");
    await context.supabase.from("account_deletion_requests").update({ ...review, status: "approved" }).eq("id", data.id);
    return { ok: true };
  });
