import smallPotato from "@/assets/variant-sizes/batata-small-loose.jpg";
import mediumPotato from "@/assets/variant-sizes/batata-medium-loose.jpg";
import largePotato from "@/assets/variant-sizes/batata-large-loose.jpg";
import smallRedPotato from "@/assets/variant-sizes/batata-vermelha-small-loose.jpg";
import mediumRedPotato from "@/assets/variant-sizes/batata-vermelha-medium-loose.jpg";
import largeRedPotato from "@/assets/variant-sizes/batata-vermelha-large-loose.jpg";
import smallOnion from "@/assets/variant-sizes/cebola-small-loose.jpg";
import mediumOnion from "@/assets/variant-sizes/cebola-medium-loose.jpg";
import largeOnion from "@/assets/variant-sizes/cebola-large-loose.jpg";
import { variantSize } from "@/lib/catalog";
import { productImageStyle } from "@/lib/product-images";

const sprite: Record<string, string> = { tomate: "product-tomate", batata: "product-batata", cenoura: "product-cenoura", cebola: "product-cebola", repolho: "product-repolho", pimento: "product-pimento" };

const photos = {
  batata: { Pequenas: smallPotato, Médias: mediumPotato, Grandes: largePotato },
  redPotato: { Pequenas: smallRedPotato, Médias: mediumRedPotato, Grandes: largeRedPotato },
  cebola: { Pequenas: smallOnion, Médias: mediumOnion, Grandes: largeOnion },
};

export function VariantPhoto({ product, className = "", priority = false }: { product: { name: string; image_key: string }; className?: string; priority?: boolean }) {
  const size = variantSize(product.name);
  const set = product.image_key === "batata" ? /vermelha/i.test(product.name) ? photos.redPotato : photos.batata : product.image_key === "cebola" ? photos.cebola : null;
  const image = set ? size !== "Outras variantes" ? set[size] : set["Médias"] : product.image_key === "batata" && /vermelha/i.test(product.name) ? mediumRedPotato : null;
  return image ? <img src={image} alt={product.name} width={512} height={512} loading={priority ? "eager" : "lazy"} className={`aspect-square w-full object-cover ${className}`} /> : <div role="img" aria-label={product.name} className={`product-photo w-full ${sprite[product.image_key] ?? "product-generic"} ${className}`} style={productImageStyle(product.image_key)} />;
}