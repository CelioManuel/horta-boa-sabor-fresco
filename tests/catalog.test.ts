import { expect, test } from "bun:test";
import { filterCatalogue, produceFamily } from "../src/lib/catalog";

const products = [{ name: "Batata Reno", category: "Tubérculos" }, { name: "Batata doce", category: "Tubérculos" }, { name: "Batata (saco de 10 kg)", category: "Tubérculos" }, { name: "Tomate Fresco", category: "Frutos" }];
test("Products without a family includes the whole catalogue", () => expect(filterCatalogue(products)).toEqual(products));
test("a home batata selection returns every batata variant and no tomato", () => expect(filterCatalogue(products, "", "Todos", produceFamily("Batata Reno")).map((p) => p.name)).toEqual(["Batata Reno", "Batata doce", "Batata (saco de 10 kg)"]));