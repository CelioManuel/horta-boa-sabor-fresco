import smallPotato from "@/assets/variant-sizes/batata-small.jpg";
import mediumPotato from "@/assets/variant-sizes/batata-medium.jpg";
import largePotato from "@/assets/variant-sizes/batata-large.jpg";
import smallRedPotato from "@/assets/variant-sizes/batata-vermelha-small.jpg";
import mediumRedPotato from "@/assets/variant-sizes/batata-vermelha-medium.jpg";
import largeRedPotato from "@/assets/variant-sizes/batata-vermelha-large.jpg";
import smallOnion from "@/assets/variant-sizes/cebola-small.jpg";
import mediumOnion from "@/assets/variant-sizes/cebola-medium.jpg";
import largeOnion from "@/assets/variant-sizes/cebola-large.jpg";
import { variantSize } from "@/lib/catalog";
import { productImageStyle } from "@/lib/product-images";
import { photoClass } from "@/components/pages/CustomerPages";

const photos = {
  batata: { Pequenas: smallPotato, Médias: mediumPotato, Grandes: largePotato },
  redPotato: { Pequenas: smallRedPotato, Médias: mediumRedPotato, Grandes: largeRedPotato },
  cebola: { Pequenas: smallOnion, Médias: mediumOnion, Grandes: largeOnion },
};

export function VariantPhoto({ product, className = "", priority = false }: { product: { name: string; image_key: string }; className?: string; priority?: boolean }) {
  const size = variantSize(product.name);
  const set = product.image_key === "batata" ? /vermelha/i.test(product.name) ? photos.redPotato : photos.batata : product.image_key === "cebola" ? photos.cebola : null;
  const image = set && size !== "Outras variantes" ? set[size] : null;
  return image ? <img src={image} alt={product.name} width={512} height={512} loading={priority ? "eager" : "lazy"} className={`aspect-square w-full object-cover ${className}`} /> : <div role="img" aria-label={product.name} className={`product-photo w-full ${photoClass(product.image_key)} ${className}`} style={productImageStyle(product.image_key)} />;
}