export const DELETE_CONFIRM_WORD = "ELIMINAR";
const ACTIVE = ["received", "preparing", "on_the_way", "almost_there"];

/** Rules a customer must pass before a deletion request is recorded. */
export function checkDeletionRequest(input: { confirm: string; reason: string; orderStatuses: string[] }) {
  if (input.confirm.trim() !== DELETE_CONFIRM_WORD) return `Escreva ${DELETE_CONFIRM_WORD} para confirmar.`;
  if (input.reason.trim().length < 5) return "Indique o motivo do pedido.";
  if (input.orderStatuses.some((s) => ACTIVE.includes(s))) return "Tem encomendas em curso. Aguarde a entrega antes de pedir a eliminação.";
  return null;
}

/** An administrator can approve only when the customer has no order in progress. */
export function canApproveDeletion(orderStatuses: string[]) {
  return !orderStatuses.some((s) => ACTIVE.includes(s));
}
