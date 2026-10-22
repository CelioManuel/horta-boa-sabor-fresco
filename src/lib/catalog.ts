export function produceFamily(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().split(/[\s(]/)[0] ?? "";
}

export function filterCatalogue<T extends { name: string; category: string }>(products: T[], query = "", category = "Todos", family = "") {
  const term = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return products.filter((p) => (!family || produceFamily(p.name) === family) && (category === "Todos" || p.category === category) && p.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(term));
}