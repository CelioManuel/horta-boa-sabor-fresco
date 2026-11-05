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
    const { data: profile } = await context.supabase.from("profiles").select("full_name,phone").eq("id", o.user_id).maybeSingle();
    const customer = profile?.full_name ?? "Cliente";
    const customerPhone = profile?.phone ?? "-";
    const list = (items ?? []).map((i) => `- ${i.product_name}: ${i.quantity} ${i.unit_label}`).join("\n");
    const ref = o.order_number ?? o.id.slice(0, 8);
    const { sendSms, sendEmail } = await import("@/lib/notify.server");
    const { buildOrderSms } = await import("@/lib/order-sms");
    const sms = buildOrderSms({ ref: String(ref), customer, customerPhone, total: Number(o.total), payment: o.payment_method, address: o.delivery_address, items: (items ?? []).map((i) => ({ ...i, quantity: Number(i.quantity) })) });
    // If the detailed SMS is refused, send a short version so staff are always alerted.
    const smsTask = sendSms([STAFF_PHONE], sms.full).catch((e) => {
      console.error("SMS detalhada falhou, a enviar versão curta:", e instanceof Error ? e.message : e);
      return sendSms([STAFF_PHONE], sms.short);
    });
    const results = await Promise.allSettled([
      smsTask,
      sendEmail(STAFF_EMAIL, `Nova encomenda #${ref}`, `Nova encomenda #${ref}\n\nCliente: ${customer}\nTelemóvel: ${customerPhone}\nTotal: ${Number(o.total).toFixed(2)} MZN\nPagamento: ${o.payment_method}\nEntrega: ${o.delivery_address}\nNota: ${o.notes ?? "-"}\n\nProdutos:\n${list}`),
    ]);
    results.forEach((r) => r.status === "rejected" && console.error("Notificação falhou:", r.reason));
    return { ok: results.every((r) => r.status === "fulfilled") };
  });

export const notifyOrderCancelled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d?.orderId ?? "")) throw new Error("Encomenda inválida");
    return d;
  })
  .handler(async ({ data, context }) => {
    // Only the customer who cancelled their own order can trigger this alert.
    const { data: o } = await context.supabase.from("orders").select("id,order_number,total,status,user_id,operator_id,delivery_address,fulfillment").eq("id", data.orderId).maybeSingle();
    if (!o || o.user_id !== context.userId || o.status !== "cancelled") throw new Error("Encomenda não encontrada");
    const { data: profile } = await context.supabase.from("profiles").select("full_name,phone").eq("id", o.user_id).maybeSingle();
    const phones = [STAFF_PHONE];
    const emails = [STAFF_EMAIL];
    if (o.operator_id) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: op } = await supabaseAdmin.from("profiles").select("phone").eq("id", o.operator_id).maybeSingle();
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(o.operator_id);
      const opPhone = (op?.phone || u.user?.phone || "").trim();
      if (opPhone) phones.push(opPhone.startsWith("+") ? opPhone : `+${opPhone.replace(/\D/g, "")}`);
      if (u.user?.email) emails.push(u.user.email);
    }
    const ref = o.order_number ?? o.id.slice(0, 8);
    const customer = profile?.full_name || "Cliente";
    const { sendSms, sendEmail } = await import("@/lib/notify.server");
    const { toSmsText } = await import("@/lib/order-sms");
    const text = `Horta Boa: encomenda #${ref} CANCELADA pelo cliente.\nCliente: ${customer} (${profile?.phone || "-"})\nTotal: ${Number(o.total).toFixed(2)} MZN\n${o.fulfillment === "pickup" ? "Levantamento na loja" : `Entrega: ${o.delivery_address}`}`;
    const results = await Promise.allSettled([
      sendSms([...new Set(phones)], toSmsText(text)),
      ...[...new Set(emails)].map((e) => sendEmail(e, `Encomenda #${ref} cancelada`, text)),
    ]);
    results.forEach((r) => r.status === "rejected" && console.error("Notificação de cancelamento falhou:", r.reason));
    return { ok: results.every((r) => r.status === "fulfilled") };
  });
