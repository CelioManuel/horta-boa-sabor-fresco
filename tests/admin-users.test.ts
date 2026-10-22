import { expect, test } from "bun:test";
import { createAccountInput, profileInput, requireAdminRole, protectOwnAdmin } from "../src/lib/admin-users";

test("operator cannot manage users", () => expect(() => requireAdminRole(["operator", "customer"])).toThrow());
test("admin can manage users", () => expect(() => requireAdminRole(["admin"])).not.toThrow());
test("admin can create an operator account", () => expect(createAccountInput.parse({ full_name: "Operador", email: "operator@example.com", phone: "", nuit: "", roles: ["operator"], password: "testing123", redirectTo: "http://localhost:8080" }).roles).toEqual(["operator"]));
test("admin can edit operator and admin permissions", () => expect(profileInput.parse({ id: "00000000-0000-4000-8000-000000000001", full_name: "Perfil", phone: "", nuit: "", roles: ["operator", "admin"] }).roles).toEqual(["operator", "admin"]));
test("an administrator cannot revoke their own administrator access", () => expect(() => protectOwnAdmin("same", "same", ["operator"])).toThrow());