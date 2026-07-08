import React from "react";
import { SEMAFORO_STYLES } from "@/lib/costosProduccion";

// Semáforo visual de rentabilidad: verde (rentable), amarillo (margen bajo), rojo (pérdida), gris (sin datos).
export default function SemaforoRentabilidad({ nivel, label, size = "sm" }) {
  const style = SEMAFORO_STYLES[nivel] || SEMAFORO_STYLES.gray;
  const padding = size === "lg" ? "px-4 py-2" : "px-2.5 py-1";
  const textSize = size === "lg" ? "text-sm" : "text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 ${padding} rounded-full ${style.bg} ${style.text} ${textSize} font-semibold`}>
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}