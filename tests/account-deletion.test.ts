import { expect, test } from "bun:test";
import { canApproveDeletion, checkDeletionRequest } from "../src/lib/account-deletion";

test("deletion request requires typing ELIMINAR", () => {
  expect(checkDeletionRequest({ confirm: "eliminar", reason: "Já não uso", orderStatuses: [] })).not.toBeNull();
  expect(checkDeletionRequest({ confirm: "ELIMINAR", reason: "Já não uso", orderStatuses: [] })).toBeNull();
});
test("deletion request is refused while an order is in progress", () => {
  expect(checkDeletionRequest({ confirm: "ELIMINAR", reason: "Já não uso", orderStatuses: ["on_the_way"] })).not.toBeNull();
});
test("admin cannot approve while orders are in progress", () => {
  expect(canApproveDeletion(["preparing"])).toBe(false);
  expect(canApproveDeletion(["delivered", "cancelled"])).toBe(true);
});
