import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Tarjeta KPI clickeable. Se ve igual que una Card de KPI pero con
 * cursor pointer, hover suave e indicador "Ver detalle".
 */
export default function ClickableStat({ label, value, sub, onClick, accent = false, danger = false, large = false }) {
  return (
    <button type="button" onClick={onClick} className="text-left w-full">
      <Card
        className={cn(
          "p-4 transition-all hover:shadow-md hover:border-amber-400 hover:-translate-y-0.5 cursor-pointer group",
          accent && "border-amber-400 border-2",
          danger && "border-red-200"
        )}
      >
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className={cn("font-heading font-bold text-foreground", large ? "text-lg" : "text-2xl", danger && "text-red-600")}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          <p className="text-[10px] text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">Ver detalle →</p>
        </div>
      </Card>
    </button>
  );
}