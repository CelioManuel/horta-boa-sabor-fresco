import { expect, test } from "bun:test";
import { filterCatalogue, homeCatalogue, produceFamily } from "../src/lib/catalog";

const products = [{ name: "Batata Reno", category: "Tubérculos" }, { name: "Batata doce", category: "Tubérculos" }, { name: "Batata (saco de 10 kg)", category: "Tubérculos" }, { name: "Tomate Fresco", category: "Frutos" }];
test("Products without a family includes the whole catalogue", () => expect(filterCatalogue(products)).toEqual(products));
test("a home batata selection returns every batata variant and no tomato", () => expect(filterCatalogue(products, "", "Todos", produceFamily("Batata Reno")).map((p) => p.name)).toEqual(["Batata Reno", "Batata doce", "Batata (saco de 10 kg)"]));
test("home preserves the original selection without adding imported packages", () => {
  const originals = ["Tomate Fresco", "Batata Reno", "Cenoura", "Cebola", "Repolho Verde", "Pimento Verde", "Alface", "Pepino", "Beterraba", "Couve", "Abóbora", "Alho"].map((name) => ({ name }));
  expect(homeCatalogue([...originals, { name: "Batata Branca Media Rede 5 Kg" }, { name: "Caixas Pretas" }])).toEqual(originals);
});