import { describe, expect, test } from "bun:test";
import { canDeliver, itemPromoDiscount } from "../src/lib/checkout";

const now = new Date("2026-11-05T12:00:00Z").getTime();
const promo = (o: Partial<{ product_id: string; discount_percent: number; starts_at: string; ends_at: string; is_active: boolean }>) => ({ product_id: "a", discount_percent: 10, starts_at: "2026-11-05T10:00:00Z", ends_at: "2026-11-05T14:00:00Z", is_active: true, ...o });

describe("checkout rules", () => {
  test("delivery only from 1000 MZN", () => {
    expect(canDeliver(999, 1000)).toBe(false);
    expect(canDeliver(1000, 1000)).toBe(true);
  });
  test("per-article promo applies only to its product", () => {
    expect(itemPromoDiscount([{ id: "a", lineTotal: 200 }, { id: "b", lineTotal: 300 }], [promo({})], now)).toBe(20);
  });
  test("promo outside its hours does not apply", () => {
    expect(itemPromoDiscount([{ id: "a", lineTotal: 200 }], [promo({ ends_at: "2026-11-05T11:59:00Z" })], now)).toBe(0);
  });
});
