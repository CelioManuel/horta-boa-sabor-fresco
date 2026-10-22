import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldCls } from "@/components/ui-bits";

export function PasswordInput({ className = fieldCls, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false);
  return <span className="relative block">
    <input {...props} type={shown ? "text" : "password"} className={`${className} pr-12`} />
    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2" aria-label={shown ? "Ocultar palavra-passe" : "Mostrar palavra-passe"} title={shown ? "Ocultar palavra-passe" : "Mostrar palavra-passe"} aria-pressed={shown} onClick={(event) => { event.preventDefault(); setShown((current) => !current); }}>{shown ? <EyeOff /> : <Eye />}</Button>
  </span>;
}