export function normalizePhone(value: string) {
  const digits = value.replace(/[\s()-]/g, "");
  const phone = /^\d{9}$/.test(digits) ? `+258${digits}` : digits.startsWith("00") ? `+${digits.slice(2)}` : digits;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("Indique um número válido com indicativo, por exemplo +258 84 123 4567.");
  return phone;
}