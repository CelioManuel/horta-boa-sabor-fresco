import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export const statusLabel: Record<string, string> = { received: "Recebida", preparing: "Em preparação", on_the_way: "A caminho", almost_there: "Quase a chegar", delivered: "Entregue", cancelled: "Cancelada" };
export const statusFlow = ["received", "preparing", "on_the_way", "almost_there", "delivered"] as const;
export const paymentLabel: Record<string, string> = { mpesa: "M-Pesa", emola: "e-Mola", pos: "POS", cash: "Dinheiro" };
export const mzn = (v: number) => `${Number(v).toLocaleString("pt-MZ")} MZN`;
export const fieldCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

type To = "/" | "/produtos" | "/auth" | "/conta" | "/encomendas";

export function PageTitle({ title, subtitle, back }: { title: string; subtitle?: string; back?: To }) {
  return <div className="mb-8 flex items-start gap-3">{back && <Button variant="ghost" size="icon" asChild><Link to={back} aria-label="Voltar"><ArrowLeft /></Link></Button>}<div><h1 className="font-display text-3xl sm:text-4xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div></div>;
}

export function Empty({ icon: Icon = Package, title, text, action, to }: { icon?: typeof Package; title: string; text: string; action?: string; to?: To }) {
  return <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-leaf-soft text-primary"><Icon className="h-9 w-9" /></span><h2 className="mt-5 font-display text-2xl">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>{action && to && <Button className="mt-6" asChild><Link to={to}>{action}<ChevronRight /></Link></Button>}</div>;
}

export function Page({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <main className={`mx-auto min-h-[calc(100vh-72px)] ${wide ? "max-w-7xl" : "max-w-4xl"} px-4 pb-28 pt-8 sm:px-6`}>{children}</main>;
}

export function StatusTimeline({ status }: { status: string }) {
  if (status === "cancelled") return <p className="rounded-md bg-destructive/10 p-3 text-sm font-semibold text-destructive">Esta encomenda foi cancelada.</p>;
  const idx = statusFlow.indexOf(status as (typeof statusFlow)[number]);
  return <ol className="grid grid-cols-5 gap-1">{statusFlow.map((s, i) => <li key={s} className="text-center"><span className={`mx-auto block h-2 rounded-full ${i <= idx ? "bg-primary" : "bg-muted"}`} /><span className={`mt-2 block text-[10px] font-semibold sm:text-xs ${i <= idx ? "text-primary" : "text-muted-foreground"}`}>{statusLabel[s]}</span></li>)}</ol>;
}
