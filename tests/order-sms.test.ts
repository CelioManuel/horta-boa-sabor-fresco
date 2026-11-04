import { describe, expect, test } from "bun:test";
import { buildOrderSms, SMS_MAX_CHARS, toSmsText } from "../src/lib/order-sms";

const base = { ref: "42", customer: "Célio Manuel", customerPhone: "+258845630988", total: 350, payment: "mpesa", address: "Bairro Polana, nº 12", items: [{ product_name: "Cebola média", quantity: 2, unit_label: "kg" }] };

describe("order SMS", () => {
  test("removes accents and symbols the SMS provider rejects", () => {
    expect(toSmsText("Célio – nº ção")).toBe("Celio - no cao");
  });
  test("includes customer, phone, total, address and products", () => {
    const { full } = buildOrderSms(base);
    expect(full).toContain("Cliente: Celio Manuel (+258845630988)");
    expect(full).toContain("Total: 350.00 MZN - mpesa");
    expect(full).toContain("Entrega: Bairro Polana, no 12");
    expect(full).toContain("Cebola media x2 kg");
  });
  test("caps very long orders", () => {
    const items = Array.from({ length: 80 }, (_, i) => ({ product_name: `Produto ${i}`, quantity: 1, unit_label: "kg" }));
    expect(buildOrderSms({ ...base, items }).full.length).toBe(SMS_MAX_CHARS);
  });
});
