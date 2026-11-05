export type AppRole = "admin" | "operator" | "customer";

export function primaryRole(roles: readonly AppRole[]): AppRole {
  return roles.includes("admin") ? "admin" : roles.includes("operator") ? "operator" : "customer";
}

export function operatorOnly(role: AppRole | null) {
  return role === "operator";
}

export function sessionDestination(role: AppRole) {
  return operatorOnly(role) ? "/operador" as const : "/produtos" as const;
}

export function canOpenPage(role: AppRole | null, pathname: string) {
  return !operatorOnly(role) || pathname.replace(/\/$/, "") === "/operador";
}
export const permissionKeys = ["orders", "products", "users", "reports"] as const;
export type Permission = (typeof permissionKeys)[number];
export const permissionLabels: Record<Permission, string> = {
  orders: "Ver e gerir encomendas",
  products: "Gerir produtos e preços",
  users: "Gerir utilizadores",
  reports: "Ver relatórios e histórico",
};

/** Administrators hold every permission; others only what was granted. */
export function hasPermission(role: AppRole | null, granted: readonly string[], permission: Permission) {
  return role === "admin" || granted.includes(permission);
}

export function canOpenManagement(role: AppRole | null, granted: readonly string[]) {
  return role === "admin" || permissionKeys.some((p) => granted.includes(p));
}
