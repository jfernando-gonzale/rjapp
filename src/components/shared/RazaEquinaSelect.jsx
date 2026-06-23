import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RAZAS_EQUINAS } from "@/lib/helpers";

/**
 * Desplegable de raza equina con opción "Otra" → input personalizado.
 * value: string (nombre de la raza)
 * onChange: callback
 */
export default function RazaEquinaSelect({ value, onChange, label = "Raza", required = false }) {
  const esOtra = value && !RAZAS_EQUINAS.includes(value) && value !== "";
  const [seleccionada, setSeleccionada] = useState("");

  const handleSelect = (v) => {
    if (v === "Otra") {
      setSeleccionada("Otra");
      onChange("");
    } else {
      setSeleccionada(v);
      onChange(v);
    }
  };

  return (
    <div>
      <Label>{label}{required ? " *" : ""}</Label>
      <Select
        value={esOtra ? "Otra" : (value || "")}
        onValueChange={handleSelect}
      >
        <SelectTrigger><SelectValue placeholder="Seleccionar raza" /></SelectTrigger>
        <SelectContent>
          {RAZAS_EQUINAS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
        </SelectContent>
      </Select>
      {esOtra && (
        <Input
          className="mt-2"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe la raza"
        />
      )}
    </div>
  );
}