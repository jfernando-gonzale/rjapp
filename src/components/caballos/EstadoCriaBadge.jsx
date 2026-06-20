import React from "react";
import { cn } from "@/lib/utils";
import { ESTADO_CRIA, ESTADO_CRIA_COLORS } from "@/lib/caballos";

export default function EstadoCriaBadge({ estado, className }) {
  const label = ESTADO_CRIA[estado] || estado;
  const colorClass = ESTADO_CRIA_COLORS[estado] || "bg-slate-100 text-slate-700";

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
      colorClass,
      className
    )}>
      {label}
    </span>
  );
}