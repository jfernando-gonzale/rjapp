import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { ESTADO_ANIMAL } from "@/lib/helpers";
import { GitBranch, ArrowRight, Users, Heart } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Sección de genealogía para la hoja de vida del animal.
 * Muestra ASCENDENCIA (madre, padre, abuelos) y DESCENDENCIA (crías).
 * Todo clicable para navegar a la hoja de vida del animal relacionado.
 *
 * Props: animalId, especie
 */
export default function GenealogiaSection({ animalId, especie }) {
  const navigate = useNavigate();
  const { data: allAnimals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });
  const { data: partos = [] } = useQuery({ queryKey: ["partos"], queryFn: () => base44.entities.Parto.list() });

  const animal = allAnimals.find(a => a.id === animalId);
  if (!animal) return null;

  const madre = animal.mother_id ? allAnimals.find(a => a.id === animal.mother_id) : null;
  const padre = animal.father_id ? allAnimals.find(a => a.id === animal.father_id) : null;

  // Abuelos
  const abuelaMaterna = madre?.mother_id ? allAnimals.find(a => a.id === madre.mother_id) : null;
  const abueloMaterno = madre?.father_id ? allAnimals.find(a => a.id === madre.father_id) : null;
  const abuelaPaterna = padre?.mother_id ? allAnimals.find(a => a.id === padre.mother_id) : null;
  const abueloPaterno = padre?.father_id ? allAnimals.find(a => a.id === padre.father_id) : null;

  // Descendencia: animales cuya mother_id o father_id es este animal
  const descendencia = allAnimals.filter(a => a.mother_id === animalId || a.father_id === animalId);

  // Evento de nacimiento
  const eventoNacimiento = animal.birth_event_id ? partos.find(p => p.id === animal.birth_event_id) : null;

  const goTo = (id) => navigate(`/animales/${id}`);

  const ParentCard = ({ animal: a, role }) => {
    if (!a) return (
      <div className="rounded-lg border border-dashed border-muted p-3 text-center">
        <p className="text-xs text-muted-foreground">{role}</p>
        <p className="text-xs text-muted-foreground italic mt-1">Sin registrar</p>
      </div>
    );
    return (
      <button onClick={() => goTo(a.id)} className="w-full text-left">
        <Card className="p-3 hover:shadow-md hover:border-amber-400 transition-all cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <Heart className={`w-3.5 h-3.5 ${a.sexo === "hembra" ? "text-pink-500" : "text-blue-500"}`} />
            <span className="text-xs text-muted-foreground font-medium">{role}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">#{a.numero}{a.nombre ? ` (${a.nombre})` : ""}</p>
              <p className="text-xs text-muted-foreground">{a.raza || "—"} · {a.sexo === "hembra" ? "Hembra" : "Macho"}</p>
            </div>
            <StatusBadge status={a.estado} label={ESTADO_ANIMAL[a.estado]} />
          </div>
        </Card>
      </button>
    );
  };

  const hasAscendencia = madre || padre || abuelaMaterna || abueloMaterno || abuelaPaterna || abueloPaterno;

  return (
    <>
      {/* ASCENDENCIA */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-4 h-4 text-amber-500" />
          <h3 className="font-heading font-semibold">Ascendencia / Genealogía</h3>
        </div>

        {!hasAscendencia ? (
          <p className="text-sm text-muted-foreground py-3 text-center">Sin ascendencia registrada. Puedes vincular madre y padre desde Editar.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Padres</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ParentCard animal={madre} role="Madre" />
                <ParentCard animal={padre} role="Padre" />
              </div>
            </div>

            {(abuelaMaterna || abueloMaterno || abuelaPaterna || abueloPaterno) && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Abuelos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">Línea materna</p>
                    <ParentCard animal={abuelaMaterna} role="Abuela materna" />
                    <ParentCard animal={abueloMaterno} role="Abuelo materno" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">Línea paterna</p>
                    <ParentCard animal={abuelaPaterna} role="Abuela paterna" />
                    <ParentCard animal={abueloPaterno} role="Abuelo paterno" />
                  </div>
                </div>
              </div>
            )}

            {eventoNacimiento && (
              <div className="rounded-lg bg-muted/30 p-3 text-sm">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Evento de nacimiento</p>
                <p>Fecha: <span className="font-medium">{format(new Date(eventoNacimiento.fecha), "dd MMM yyyy", { locale: es })}</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">Resultado: {(eventoNacimiento.resultado || "").replace(/_/g, " ")}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* DESCENDENCIA */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            <h3 className="font-heading font-semibold">Descendencia / Crías ({descendencia.length})</h3>
          </div>
        </div>

        {descendencia.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 text-center">Sin crías registradas.</p>
        ) : (
          <div className="space-y-2">
            {descendencia.map(c => {
              const otroProgenitor = c.mother_id === animalId
                ? (c.father_id ? allAnimals.find(a => a.id === c.father_id) : null)
                : (c.mother_id ? allAnimals.find(a => a.id === c.mother_id) : null);
              return (
                <button key={c.id} onClick={() => goTo(c.id)} className="w-full text-left">
                  <Card className="p-3 hover:shadow-md hover:border-amber-400 transition-all cursor-pointer">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">#{c.numero}</span>
                          {c.nombre && <span className="text-sm text-muted-foreground">({c.nombre})</span>}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{c.mother_id === animalId ? "Madre" : "Padre"}</span>
                          <StatusBadge status={c.estado} label={ESTADO_ANIMAL[c.estado]} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.sexo === "hembra" ? "Hembra" : "Macho"}{c.raza ? ` · ${c.raza}` : ""}
                          {c.fecha_nacimiento && ` · Nació ${format(new Date(c.fecha_nacimiento), "dd MMM yyyy", { locale: es })}`}
                          {otroProgenitor && ` · Otro progenitor: #${otroProgenitor.numero}`}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}