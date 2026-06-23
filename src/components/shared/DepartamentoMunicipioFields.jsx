import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEPARTAMENTOS, getMunicipios } from "@/lib/colombia";

/**
 * Campos de ubicación dependientes: Departamento → Ciudad / Municipio.
 * Props:
 *   departamento: string, municipio (ciudad): string
 *   onChangeDepartamento, onChangeMunicipio  (callbacks)
 *   labels: { departamento: "Departamento", municipio: "Ciudad / Municipio" } (opcional)
 */
export default function DepartamentoMunicipioFields({
  departamento,
  municipio,
  onChangeDepartamento,
  onChangeMunicipio,
  labels = {},
  required = false,
  prefix = "",
}) {
  const [otroMunicipio, setOtroMunicipio] = useState(false);

  const municipios = getMunicipios(departamento);
  const lblDepto = labels.departamento || "Departamento";
  const lblMuni = labels.municipio || "Ciudad / Municipio";

  // Si el municipio guardado no está en la lista y no empieza con "Otro", mostrarlo como OTRO
  useEffect(() => {
    if (!departamento) return;
    if (municipio && !municipios.includes(municipio) && !municipio.startsWith("Otro municipio de") && !municipio.startsWith("Otra localidad de")) {
      setOtroMunicipio(true);
    }
  }, [departamento]); // eslint-disable-line

  const handleDepto = (v) => {
    setOtroMunicipio(false);
    onChangeDepartamento(v);
    onChangeMunicipio(""); // limpiar ciudad
  };

  const handleMuni = (v) => {
    if (v.startsWith("Otro municipio de") || v.startsWith("Otra localidad de")) {
      setOtroMunicipio(true);
      onChangeMunicipio("");
    } else {
      setOtroMunicipio(false);
      onChangeMunicipio(v);
    }
  };

  return (
    <>
      <div>
        <Label>{lblDepto}{required ? " *" : ""}</Label>
        <Select value={departamento || ""} onValueChange={handleDepto}>
          <SelectTrigger><SelectValue placeholder="Seleccionar departamento" /></SelectTrigger>
          <SelectContent>
            {DEPARTAMENTOS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{lblMuni}{required ? " *" : ""}</Label>
        {!departamento ? (
          <Select disabled>
            <SelectTrigger><SelectValue placeholder="Primero selecciona un departamento" /></SelectTrigger>
            <SelectContent />
          </Select>
        ) : (
          <Select value={otroMunicipio ? "" : (municipio || "")} onValueChange={handleMuni}>
            <SelectTrigger><SelectValue placeholder="Seleccionar municipio" /></SelectTrigger>
            <SelectContent>
              {municipios.map(m => (
                <SelectItem key={m} value={m}>{m.startsWith("Otro") ? "Otro municipio" : m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {otroMunicipio && (
        <div className={prefix ? `${prefix}` : ""}>
          <Label>Escribir municipio</Label>
          <Input
            value={municipio || ""}
            onChange={(e) => onChangeMunicipio(e.target.value)}
            placeholder="Nombre del municipio"
          />
        </div>
      )}
    </>
  );
}