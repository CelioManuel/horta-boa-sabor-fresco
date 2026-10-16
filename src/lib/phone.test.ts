import { expect, test } from "bun:test";
import { normalizePhone } from "./phone";
test("normalizes Mozambique local numbers", () => {
  expect(normalizePhone("84 123 4567")).toBe("+258841234567");
});
test("keeps international numbers", () => {
  expect(normalizePhone("+258 84 123 4567")).toBe("+258841234567");
});
test("rejects invalid numbers before signup", () => {
  expect(() => normalizePhone("abc")).toThrow();
});