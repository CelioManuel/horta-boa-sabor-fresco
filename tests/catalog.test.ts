import { expect, test } from "bun:test";
import { filterCatalogue, groupVariants, homeCatalogue, produceFamily, variantSize } from "../src/lib/catalog";

const products = [{ name: "Batata Reno", category: "Tubérculos" }, { name: "Batata doce", category: "Tubérculos" }, { name: "Batata (saco de 10 kg)", category: "Tubérculos" }, { name: "Tomate Fresco", category: "Frutos" }];
test("variants are grouped by the named produce size, not package weight", () => {
  expect(variantSize("Batata Branca Pequena Rede 10 Kg")).toBe("Pequenas");
  expect(variantSize("Batata Vermelha Média Saco 5 Kg")).toBe("Médias");
  expect(variantSize("Batata Branca Grande Rede 5 KG")).toBe("Grandes");
  expect(variantSize("Batata Reno saco 10 kg")).toBe("Outras variantes");
});
test("grouping preserves every variant in size order without empty groups", () => {
  const list = [{ name: "Batata Grande" }, { name: "Batata Reno" }, { name: "Batata Pequena" }, { name: "Batata Media" }];
  const groups = groupVariants(list);
  expect(groups.map((g) => g.size)).toEqual(["Pequenas", "Médias", "Grandes", "Outras variantes"]);
  expect(groups.flatMap((g) => g.products)).toHaveLength(4);
  expect(groupVariants([{ name: "Cenoura" }]).map((g) => g.size)).toEqual(["Outras variantes"]);
});
test("Products without a family includes the whole catalogue", () => expect(filterCatalogue(products)).toEqual(products));
test("a home batata selection returns every batata variant and no tomato", () => expect(filterCatalogue(products, "", "Todos", produceFamily("Batata Reno")).map((p) => p.name)).toEqual(["Batata Reno", "Batata doce", "Batata (saco de 10 kg)"]));
test("home preserves the original selection without adding imported packages", () => {
  const originals = ["Tomate Fresco", "Batata Reno", "Cenoura", "Cebola", "Repolho Verde", "Pimento Verde", "Alface", "Pepino", "Beterraba", "Couve", "Abóbora", "Alho"].map((name) => ({ name }));
  expect(homeCatalogue([...originals, { name: "Batata Branca Media Rede 5 Kg" }, { name: "Caixas Pretas" }])).toEqual(originals);
});