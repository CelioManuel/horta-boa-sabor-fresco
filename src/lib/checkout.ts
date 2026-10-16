export const DELIVERY_FEE = 0;

export function checkoutTotals(subtotal: number, discountPercent = 0) {
  const discount = Math.round(subtotal * discountPercent) / 100;
  return { deliveryFee: DELIVERY_FEE, discount, total: subtotal - discount };
}