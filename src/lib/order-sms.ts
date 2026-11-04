// Pure helpers for order SMS text. Accents and special symbols are removed because
// the SMS provider rejects or garbles some non-GSM characters, and long texts are capped.
export const SMS_MAX_CHARS = 600;

export function toSmsText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ºª°]/g, (c) => (c === "ª" ? "a" : "o"))
    .replace(/[–—]/g, "-")
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E\n]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

type SmsOrder = { ref: string; customer: string; customerPhone: string; total: number; payment: string; address: string; items: { product_name: string; quantity: number; unit_label: string }[] };

export function buildOrderSms(o: SmsOrder): { full: string; short: string } {
  const head = [`Horta Boa: nova encomenda #${o.ref}`, `Cliente: ${o.customer} (${o.customerPhone})`, `Total: ${o.total.toFixed(2)} MZN - ${o.payment}`];
  const products = o.items.map((i) => `${i.product_name} x${i.quantity} ${i.unit_label}`).join(", ");
  let full = toSmsText([...head, `Entrega: ${o.address}`, `Produtos: ${products}`].join("\n"));
  if (full.length > SMS_MAX_CHARS) full = `${full.slice(0, SMS_MAX_CHARS - 3)}...`;
  const short = toSmsText([...head, `${o.items.length} produto(s). Ver detalhes no painel.`].join("\n"));
  return { full, short };
}
