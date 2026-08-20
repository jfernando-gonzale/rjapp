import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Baby } from "lucide-react";
import { getRazasByEspecie } from "@/lib/helpers";
import { validarDuplicado, normalizeNumero, especieLabelLower } from "@/lib/duplicados";

/**
 * Sección reutilizable para registrar crías desde el formulario de la madre.
 * Las crías vivas con "crear_inventario" se crean automáticamente como animales
 * independientes en el inventario, vinculados mediante mother_id / father_id.
 *
 * Props:
 * - especie: especie de la madre (y de las crías)
 * - motherFincaId, motherLoteId: herencia por defecto
 * - sexoMadre: solo se muestra si es "hembra"
 * - onCriasChange(crias): eleva el array de crías al formulario padre
 */
const RESULTADO_CRIA = {
  cria_viva: "Cría viva",
  cria_muerta: "Cría muerta",
  aborto: "Aborto",
  complicacion: "Complicación",
};

export default function CriasSection({ especie, motherFincaId, motherLoteId, sexoMadre, onCriasChange }) {
  const [crias, setCrias] = useState([]);

  const { user } = useAuth();
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });
  const { data: allAnimals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });

  // Aislamiento: solo validar contra los animales del usuario actual.
  const misAnimales = useMemo(() => (allAnimals || []).filter((a) => a.created_by_id === user?.id), [allAnimals, user]);

  // Padres potenciales: machos de la misma especie
  const padres = allAnimals.filter(a => (a.especie || "bovino") === especie && a.sexo === "macho" && a.estado === "activo");
  const razas = getRazasByEspecie(especie);

  useEffect(() => {
    onCriasChange(crias);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crias]);

  if (sexoMadre !== "hembra") return null;

  const addCria = () => {
    setCrias(prev => [...prev, {
      numero: "",
      nombre: "",
      sexo: "hembra",
      fecha_nacimiento: "",
      raza: "",
      color: "",
      padre_id: "",
      finca_id: motherFincaId || "",
      lote_id: motherLoteId || "",
      observaciones: "",
      crear_inventario: true,
      resultado: "cria_viva",
    }]);
  };

  const updateCria = (idx, field, value) => {
    setCrias(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const removeCria = (idx) => {
    setCrias(prev => prev.filter((_, i) => i !== idx));
  };

  const especieLabel = { bovino: "Bovino", ovino: "Ovino", equino: "Equino" }[especie] || "Animal";
  const criaLabel = { bovino: "Ternero/a", ovino: "Cordero/a", equino: "Potro/a" }[especie] || "Cría";

  return (
    <Card className="p-5 space-y-4 mb-4 border-l-4 border-l-amber-400">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Baby className="w-5 h-5 text-amber-500" />
          <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Crías / Descendencia
          </h2>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addCria} className="gap-2">
          <Plus className="w-4 h-4" /> Agregar cría
        </Button>
      </div>

      <p className="text-xs text-muted-foreground -mt-2">
        Registra {criaLabel.toLowerCase()}s de esta madre. Las crías vivas se crean automáticamente en el inventario {especieLabel.toLowerCase()} y quedan vinculadas por genealogía (madre/padre).
      </p>

      {crias.length === 0 ? (
        <div className="text-center py-4 text-sm text-muted-foreground border border-dashed border-muted rounded-lg">
          Esta madre no tiene crías registradas todavía. Presiona "Agregar cría" para registrar una.
        </div>
      ) : (
        <div className="space-y-3">
          {crias.map((c, idx) => {
            const fincaCria = c.finca_id || motherFincaId;
            const vCria = validarDuplicado({ numero: c.numero, especie, finca_id: fincaCria, animales: misAnimales });
            // Duplicado dentro de la misma camada/parto
            const intraDup = c.numero && crias.some((o, j) => j !== idx && normalizeNumero(o.numero) === normalizeNumero(c.numero));
            const esDupActivo = vCria.status === "duplicado_activo" || intraDup;
            return (
              <div key={idx} className="rounded-lg border p-3 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">{criaLabel} #{idx + 1}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeCria(idx)} className="h-7 w-7 text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Número / Chapeta</Label>
                    <Input value={c.numero} onChange={(e) => updateCria(idx, "numero", e.target.value)} placeholder="Ej: 5140" className={esDupActivo ? "border-red-400" : ""} />
                    {intraDup && <p className="text-[11px] text-red-600 mt-0.5">Este número está repetido entre las crías de este parto.</p>}
                    {!intraDup && vCria.status === "duplicado_activo" && <p className="text-[11px] text-red-600 mt-0.5">Ya existe un {especieLabelLower(especie)} activo con este número en esta finca.</p>}
                    {!intraDup && vCria.status === "usado_anteriormente" && <p className="text-[11px] text-amber-600 mt-0.5">Número usado antes en un animal no activo. Puedes reutilizarlo.</p>}
                  </div>
                  <div>
                    <Label className="text-xs">Nombre (opcional)</Label>
                    <Input value={c.nombre} onChange={(e) => updateCria(idx, "nombre", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Sexo</Label>
                    <Select value={c.sexo} onValueChange={(v) => updateCria(idx, "sexo", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hembra">Hembra</SelectItem>
                        <SelectItem value="macho">Macho</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Fecha de nacimiento</Label>
                    <Input type="date" value={c.fecha_nacimiento} onChange={(e) => updateCria(idx, "fecha_nacimiento", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Resultado</Label>
                    <Select value={c.resultado} onValueChange={(v) => updateCria(idx, "resultado", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(RESULTADO_CRIA).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Raza</Label>
                    <Select value={c.raza} onValueChange={(v) => updateCria(idx, "raza", v)}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {razas.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Color (opcional)</Label>
                    <Input value={c.color} onChange={(e) => updateCria(idx, "color", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Padre / Reproductor</Label>
                    <Select value={c.padre_id} onValueChange={(v) => updateCria(idx, "padre_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Sin asignar</SelectItem>
                        {padres.map(p => <SelectItem key={p.id} value={p.id}>#{p.numero}{p.nombre ? ` (${p.nombre})` : ""}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Finca de nacimiento</Label>
                    <Select value={c.finca_id} onValueChange={(v) => updateCria(idx, "finca_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {fincas.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Lote / Potrero</Label>
                    <Select value={c.lote_id} onValueChange={(v) => updateCria(idx, "lote_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Sin lote" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Sin lote</SelectItem>
                        {lotes.map(l => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Observaciones</Label>
                  <Input value={c.observaciones} onChange={(e) => updateCria(idx, "observaciones", e.target.value)} />
                </div>

                {c.resultado === "cria_viva" && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={c.crear_inventario} onCheckedChange={(v) => updateCria(idx, "crear_inventario", v)} />
                    <span>Crear automáticamente en inventario {especieLabel.toLowerCase()}</span>
                  </label>
                )}
                {c.resultado !== "cria_viva" && (
                  <p className="text-xs text-amber-600">⚠️ Este resultado no crea un animal en inventario. El evento queda registrado en la hoja de vida de la madre.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}