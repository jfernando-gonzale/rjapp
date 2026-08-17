import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { ESTADO_ANIMAL, formatWeight } from "@/lib/helpers";
import { Search, X } from "lucide-react";

/**
 * Panel reutilizable que muestra una lista filtrada de animales con buscador.
 * Cada fila es clickeable y abre la hoja de vida del animal.
 *
 * Props:
 * - open, onOpenChange
 * - title: título del panel
 * - description: subtítulo opcional
 * - animals: array de animales a mostrar (ya filtrados por el llamador)
 */
export default function AnimalListPanel({ open, onOpenChange, title, description, animals = [] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });
  const { data: allAnimals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });

  const fincaName = (fid) => fincas.find(f => f.id === fid)?.nombre || "—";
  const loteName = (lid) => lotes.find(l => l.id === lid)?.nombre || "—";
  const animalById = (aid) => allAnimals.find(a => a.id === aid);

  const filtered = useMemo(() => {
    if (!search.trim()) return animals;
    const q = search.toLowerCase();
    return animals.filter(a =>
      (a.numero || "").toLowerCase().includes(q) ||
      (a.nombre || "").toLowerCase().includes(q) ||
      (a.raza || "").toLowerCase().includes(q) ||
      (a.estado || "").toLowerCase().includes(q) ||
      fincaName(a.finca_id).toLowerCase().includes(q) ||
      loteName(a.lote_id).toLowerCase().includes(q) ||
      (a.sexo || "").toLowerCase().includes(q)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, animals, fincas, lotes]);

  const handleRowClick = (a) => {
    onOpenChange(false);
    navigate(`/animales/${a.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, nombre, raza, finca, lote, estado..."
            className="pl-9 pr-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-muted-foreground mb-2">
          {filtered.length} de {animals.length} animales
        </div>

        <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
          {filtered.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">No hay animales para mostrar</Card>
          ) : (
            filtered.map(a => {
              const madre = a.mother_id ? animalById(a.mother_id) : null;
              const padre = a.father_id ? animalById(a.father_id) : null;
              return (
                <button
                  key={a.id}
                  onClick={() => handleRowClick(a)}
                  className="w-full text-left"
                >
                  <Card className="p-3 hover:shadow-md hover:border-amber-400 transition-all cursor-pointer">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">#{a.numero}</span>
                          {a.nombre && <span className="text-sm text-muted-foreground">({a.nombre})</span>}
                          <StatusBadge status={a.estado} label={ESTADO_ANIMAL[a.estado]} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.sexo === "hembra" ? "Hembra" : "Macho"}{a.raza ? ` · ${a.raza}` : ""} · {fincaName(a.finca_id)} · {loteName(a.lote_id)}
                        </p>
                        {(madre || padre) && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {madre && `Madre: #${madre.numero}`}{madre && padre && " · "}{padre && `Padre: #${padre.numero}`}
                          </p>
                        )}
                      </div>
                      {a.ultimo_peso != null && (
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{formatWeight(a.ultimo_peso)}</span>
                      )}
                    </div>
                  </Card>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}