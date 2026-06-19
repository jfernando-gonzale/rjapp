import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const colorMap = {
  green: "bg-emerald-100 text-emerald-700 border-emerald-200",
  yellow: "bg-amber-100 text-amber-700 border-amber-200",
  red: "bg-red-100 text-red-700 border-red-200",
  gray: "bg-gray-100 text-gray-500 border-gray-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
};

const statusColorMap = {
  activo: "green",
  activa: "green",
  vendido: "blue",
  muerto: "red",
  descartado: "yellow",
  trasladado: "yellow",
  cerrado: "gray",
  inactiva: "gray",
};

export default function StatusBadge({ status, label, color, className }) {
  const resolvedColor = color || statusColorMap[status] || "gray";
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs font-medium border px-2 py-0.5",
        colorMap[resolvedColor],
        className
      )}
    >
      {label || status}
    </Badge>
  );
}