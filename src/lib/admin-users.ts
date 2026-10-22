import { z } from "zod";

export const accountRole = z.enum(["customer", "operator", "admin"]);
export const profileInput = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(40),
  nuit: z.string().trim().max(40),
  roles: z.array(accountRole).min(1).max(3),
});
export const createAccountInput = profileInput.omit({ id: true }).extend({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  redirectTo: z.string().url(),
});
export function requireAdminRole(roles: string[]) {
  if (!roles.includes("admin")) throw new Error("Apenas administradores podem gerir utilizadores.");
}
export function protectOwnAdmin(callerId: string, targetId: string, roles: string[]) {
  if (callerId === targetId && !roles.includes("admin")) throw new Error("Não pode remover a sua própria permissão de administrador.");
}