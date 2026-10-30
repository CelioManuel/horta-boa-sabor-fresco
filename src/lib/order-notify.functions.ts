import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STAFF_EMAIL = "info@hortaboa.co.mz";
const STAFF_PHONE = "+258845630988";

export const notifyNewOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d?.orderId ?? "")) throw new Error("Encomenda inválida");
    return d;
  })
  .handler(async ({ data, context }) => {
    // RLS: only the customer's own order is readable here.
    const { data: o } = await context.supabase.from("orders").select("id,order_number,total,payment_method,delivery_address,notes,user_id").eq("id", data.orderId).maybeSingle();
    if (!o || o.user_id !== context.userId) throw new Error("Encomenda não encontrada");
    const { data: items } = await context.supabase.from("order_items").select("product_name,quantity,unit_label").eq("order_id", o.id);
    const list = (items ?? []).map((i) => `- ${i.product_name}: ${i.quantity} ${i.unit_label}`).join("\n");
    const ref = o.order_number ?? o.id.slice(0, 8);
    const { sendSms, sendEmail } = await import("@/lib/notify.server");
    const results = await Promise.allSettled([
      sendSms([STAFF_PHONE], `Horta Boa: nova encomenda #${ref} - ${Number(o.total).toFixed(2)} MZN (${o.payment_method}). Entrega: ${o.delivery_address}`),
      sendEmail(STAFF_EMAIL, `Nova encomenda #${ref}`, `Nova encomenda #${ref}\n\nTotal: ${Number(o.total).toFixed(2)} MZN\nPagamento: ${o.payment_method}\nEntrega: ${o.delivery_address}\nNota: ${o.notes ?? "-"}\n\nProdutos:\n${list}`),
    ]);
    results.forEach((r) => r.status === "rejected" && console.error("Notificação falhou:", r.reason));
    return { ok: results.every((r) => r.status === "fulfilled") };
  });
