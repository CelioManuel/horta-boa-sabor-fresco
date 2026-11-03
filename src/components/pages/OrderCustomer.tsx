import { useEffect, useState } from "react";
import { Mail, MapPin, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type Customer = { order_id: string; full_name: string | null; phone: string | null; email: string | null; nuit: string | null; account_phone: string | null };

export function useOrderCustomers(ids: string[]) {
  const [map, setMap] = useState<Record<string, Customer>>({});
  const key = ids.join(",");
  useEffect(() => {
    if (!ids.length) return;
    void supabase.rpc("get_order_customers", { order_ids: ids }).then(({ data }) => {
      const m: Record<string, Customer> = {};
      for (const c of (data ?? []) as Customer[]) m[c.order_id] = c;
      setMap(m);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return map;
}

export function mapUrl(address: string, lat?: number | null, lng?: number | null) {
  const q = lat != null && lng != null ? `${lat},${lng}` : address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

const tel = (p: string) => (p.startsWith("+") ? p : p.length === 9 ? `+258${p}` : `+${p}`);

export function CustomerCard({ c, address, lat, lng }: { c?: Customer | undefined; address: string; lat?: number | null; lng?: number | null }) {
  const phone = c?.phone || c?.account_phone || "";
  return <div className="rounded-md border border-border bg-background p-3 text-sm">
    <strong className="mb-2 block">Cliente</strong>
    {!c ? <p className="text-muted-foreground">Dados do cliente indisponíveis.</p> : <ul className="space-y-1.5">
      <li><User className="mr-2 inline h-4 w-4 text-muted-foreground" />{c.full_name || "Sem nome"}{c.nuit && <small className="ml-2 text-muted-foreground">NUIT {c.nuit}</small>}</li>
      {phone && <li><Phone className="mr-2 inline h-4 w-4 text-muted-foreground" /><a className="font-semibold text-primary underline-offset-2 hover:underline" href={`tel:${tel(phone)}`}>{tel(phone)}</a> · <a className="text-primary underline-offset-2 hover:underline" href={`https://wa.me/${tel(phone).replace("+", "")}`} target="_blank" rel="noreferrer">WhatsApp</a></li>}
      {c.email && <li><Mail className="mr-2 inline h-4 w-4 text-muted-foreground" /><a className="text-primary underline-offset-2 hover:underline" href={`mailto:${c.email}`}>{c.email}</a></li>}
    </ul>}
    <p className="mt-2"><MapPin className="mr-2 inline h-4 w-4 text-muted-foreground" /><a className="text-primary underline-offset-2 hover:underline" href={mapUrl(address, lat, lng)} target="_blank" rel="noreferrer">{address}{lat != null && " (localização GPS)"}</a></p>
  </div>;
}
