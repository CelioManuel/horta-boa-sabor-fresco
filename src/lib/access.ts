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