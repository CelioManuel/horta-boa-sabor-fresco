import { supabase } from "@/integrations/supabase/client";

export async function loadVisibleProducts() {
  const products = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("products").select("id,name,category,price,unit_label,min_quantity,image_key,stock,description,is_featured").eq("is_active", true).order("is_featured", { ascending: false }).order("id").range(offset, offset + 499);
    if (error) throw error;
    products.push(...(data ?? []).map((item) => ({ ...item, price: Number(item.price), min_quantity: Number(item.min_quantity), stock: Number(item.stock) })));
    if (!data || data.length < 500) break;
  }
  return products;
}