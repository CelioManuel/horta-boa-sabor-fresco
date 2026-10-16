import { describe, expect, test } from "bun:test";
import { checkoutTotals } from "./checkout";

describe("free delivery", () => {
  test("charges zero delivery on a 600 MZN order", () => {
    expect(checkoutTotals(600)).toEqual({ deliveryFee: 0, discount: 0, total: 600 });
  });
  test("charges zero delivery after a discount", () => {
    expect(checkoutTotals(800, 10)).toEqual({ deliveryFee: 0, discount: 80, total: 720 });
  });
});