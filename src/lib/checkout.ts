export const DELIVERY_FEE = 0;
export const DEFAULT_MIN_DELIVERY = 1000;

export type ItemPromo = { product_id: string | null; discount_percent: number; starts_at: string; ends_at: string; is_active: boolean };
export type PromoLine = { id: string; lineTotal: number };

export function isPromoLive(p: Pick<ItemPromo, "is_active" | "starts_at" | "ends_at">, now = Date.now()) {
  return p.is_active && new Date(p.starts_at).getTime() <= now && new Date(p.ends_at).getTime() >= now;
}

/** Best live per-article discount for each line, in MZN (rounded to cents). */
export function itemPromoDiscount(lines: PromoLine[], promos: ItemPromo[], now = Date.now()) {
  let total = 0;
  for (const l of lines) {
    const best = Math.max(0, ...promos.filter((p) => p.product_id === l.id && isPromoLive(p, now)).map((p) => p.discount_percent));
    total += Math.round(l.lineTotal * best) / 100;
  }
  return Math.round(total * 100) / 100;
}

export function canDeliver(subtotal: number, minDelivery: number) {
  return subtotal >= minDelivery;
}

export function checkoutTotals(subtotal: number, discountPercent = 0, itemDiscount = 0) {
  const discount = Math.round(subtotal * discountPercent) / 100 + itemDiscount;
  return { deliveryFee: DELIVERY_FEE, discount, total: Math.max(0, subtotal - discount) };
}
