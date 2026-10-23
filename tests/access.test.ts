import { expect, test } from "bun:test";
import { canOpenPage, primaryRole, sessionDestination } from "../src/lib/access";

test("operator accounts can only open their operator panel", () => {
  expect(canOpenPage("operator", "/operador")).toBe(true);
  for (const path of ["/", "/admin", "/produtos", "/produtos/variantes/batata", "/conta", "/auth", "/carrinho"]) expect(canOpenPage("operator", path)).toBe(false);
});
test("operator login lands on the operator panel even with a customer role", () => {
  expect(sessionDestination(primaryRole(["customer", "operator"]))).toBe("/operador");
});
test("administrators retain all pages including the operator panel", () => {
  const role = primaryRole(["operator", "admin"]);
  expect(role).toBe("admin");
  expect(canOpenPage(role, "/admin")).toBe(true);
  expect(canOpenPage(role, "/produtos")).toBe(true);
  expect(canOpenPage(role, "/operador")).toBe(true);
});