export function produceFamily(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().split(/[\s(]/)[0] ?? "";
}

export const variantSizes = ["Pequenas", "Médias", "Grandes", "Outras variantes"] as const;
export type VariantSize = (typeof variantSizes)[number];

export function variantSize(name: string): VariantSize {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\bpequen[oa]s?\b/.test(normalized)) return "Pequenas";
  if (/\bmedi[oa]s?\b/.test(normalized)) return "Médias";
  if (/\bgrandes?\b/.test(normalized)) return "Grandes";
  return "Outras variantes";
}

export function groupVariants<T extends { name: string }>(products: T[]) {
  return variantSizes.map((size) => ({ size, products: products.filter((product) => variantSize(product.name) === size) })).filter((group) => group.products.length > 0);
}

const originalHomeNames = ["Tomate Fresco", "Batata Reno", "Cenoura", "Cebola", "Repolho Verde", "Pimento Verde", "Alface", "Pepino", "Beterraba", "Couve", "Abóbora", "Alho"];

export function homeCatalogue<T extends { name: string }>(products: T[]) {
  return products.filter((product) => originalHomeNames.includes(product.name));
}

export function filterCatalogue<T extends { name: string; category: string }>(products: T[], query = "", category = "Todos", family = "") {
  const term = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return products.filter((p) => (!family || produceFamily(p.name) === family) && (category === "Todos" || p.category === category) && p.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(term));
}