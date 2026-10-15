const files = import.meta.glob("../assets/products/*.jpg", { eager: true, import: "default" }) as Record<string, string>;
const images: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) images[path.split("/").pop()!.replace(".jpg", "")] = url;
export const productImageKeys = ["tomate", "batata", "cenoura", "cebola", "repolho", "pimento", ...Object.keys(images).sort(), "generic"];
/** Background style for a product photo; null means use the sprite class. */
export function productImageStyle(key: string) {
  const url = images[key];
  return url ? { backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined;
}
