import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";

/**
 * Mensaje de validación de número/chapeta en tiempo real.
 * Props:
 *  - validacion: resultado de validarDuplicado()
 *  - especieLabel: etiqueta en minúsculas ("bovino" | "ovino" | "equino" | "yegua" | ...)
 */
export default function NumeroValidationMessage({ validacion, especieLabel = "animal" }) {
  if (!validacion || validacion.status === "vacio") return null;
  if (validacion.status === "disponible") {
    return (
      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" /> Número disponible.
      </p>
    );
  }
  if (validacion.status === "duplicado_activo") {
    return (
      <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
        <AlertCircle className="w-3.5 h-3.5" /> Ya existe un {especieLabel} activo con este número en esta finca.
      </p>
    );
  }
  if (validacion.status === "usado_anteriormente") {
    return (
      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
        <AlertTriangle className="w-3.5 h-3.5" /> Este número fue usado antes en un animal no activo. Puedes reutilizarlo si es correcto.
      </p>
    );
  }
  return null;
}