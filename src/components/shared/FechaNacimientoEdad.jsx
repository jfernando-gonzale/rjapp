import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { calcEdadDesdeNacimiento } from "@/lib/helpers";

/**
 * Campo de edad que se calcula automáticamente desde la fecha de nacimiento.
 * Si no hay fecha de nacimiento, el usuario puede escribir la edad manualmente.
 *
 * Props:
 *   fechaNacimiento: string (YYYY-MM-DD)
 *   edad: string
 *   onChangeFecha: (value) => void
 *   onChangeEdad: (value) => void
 */
export default function FechaNacimientoEdad({
  fechaNacimiento,
  edad,
  onChangeFecha,
  onChangeEdad,
  labelFecha = "Fecha de nacimiento",
  labelEdad = "Edad aproximada",
}) {
  const edadCalculada = calcEdadDesdeNacimiento(fechaNacimiento);

  useEffect(() => {
    if (edadCalculada) {
      onChangeEdad(edadCalculada);
    }
    // Si se borra la fecha, no forzamos borrar la edad (el usuario puede tener una manual)
  }, [fechaNacimiento, edadCalculada]); // eslint-disable-line

  return (
    <>
      <div>
        <Label>{labelFecha}</Label>
        <Input
          type="date"
          value={fechaNacimiento || ""}
          onChange={(e) => onChangeFecha(e.target.value)}
        />
      </div>
      <div>
        <Label>{labelEdad}</Label>
        <Input
          value={edadCalculada || edad || ""}
          disabled={Boolean(edadCalculada)}
          onChange={(e) => onChangeEdad(e.target.value)}
          placeholder={edadCalculada ? "" : "Ej: 2 años"}
        />
        {edadCalculada ? (
          <p className="text-xs text-amber-600 mt-0.5">✓ Calculada automáticamente</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">Ingresa la fecha para calcularla, o escríbela manualmente</p>
        )}
      </div>
    </>
  );
}