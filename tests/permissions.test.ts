import { describe, expect, test } from "bun:test";
import { canOpenManagement, hasPermission } from "../src/lib/access";

describe("permissions", () => {
  test("admin has every permission", () => expect(hasPermission("admin", [], "users")).toBe(true));
  test("operator only gets granted permissions", () => {
    expect(hasPermission("operator", ["orders"], "orders")).toBe(true);
    expect(hasPermission("operator", ["orders"], "products")).toBe(false);
  });
  test("management panel needs admin or at least one permission", () => {
    expect(canOpenManagement("customer", [])).toBe(false);
    expect(canOpenManagement("customer", ["reports"])).toBe(true);
  });
});
