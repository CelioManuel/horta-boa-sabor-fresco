import { expect, test } from "bun:test";
import { checkoutTotals } from "../src/lib/checkout";

test("new checkout without promotional codes has no discount", () => expect(checkoutTotals(1350)).toEqual({ deliveryFee: 0, discount: 0, total: 1350 }));