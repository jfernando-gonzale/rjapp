import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { ESPECIES } from "@/lib/helpers";

/**
 * Selector de animal con búsqueda rápida por número, nombre, raza, finca o lote.
 * Incluye un input oculto con `name` para integrarse con FormData.
 */
export default function AnimalSearchSelect({ name = "animal_id", value, onChange, especie, required, placeholder = "Buscar por número, nombre, raza, finca..." }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });

  const selectedAnimal = animals.find(a => a.id === value);
  const fincaMap = useMemo(() => Object.fromEntries(fincas.map(f => [f.id, f.nombre])), [fincas]);
  const loteMap = useMemo(() => Object.fromEntries(lotes.map(l => [l.id, l.nombre])), [lotes]);

  const filtered = useMemo(() => {
    let list = animals.filter(a => a.estado !== "vendido");
    if (especie) list = list.filter(a => (a.especie || "bovino") === especie);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.numero?.toLowerCase().includes(q) ||
        a.nombre?.toLowerCase().includes(q) ||
        a.raza?.toLowerCase().includes(q) ||
        (fincaMap[a.finca_id] || "").toLowerCase().includes(q) ||
        (loteMap[a.lote_id] || "").toLowerCase().includes(q)
      );
    }
    return list.slice(0, 50);
  }, [animals, especie, search, fincaMap, loteMap]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clear = () => { onChange(""); setSearch(""); };

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name={name} value={value || ""} />
      {selectedAnimal ? (
        <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-amber-50 border-amber-300">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-heading font-bold">#{selectedAnimal.numero}</span>
            {selectedAnimal.nombre && <span className="text-sm text-muted-foreground truncate">({selectedAnimal.nombre})</span>}
            {selectedAnimal.raza && <span className="text-xs text-muted-foreground hidden sm:inline">· {selectedAnimal.raza}</span>}
          </div>
          <button type="button" onClick={clear} className="ml-2 flex-shrink-0">
            <X className="w-4 h-4 text-muted-foreground hover:text-red-600" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            required={required}
            className="pl-10"
          />
        </div>
      )}
      {open && !selectedAnimal && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-md border bg-popover shadow-lg">
          {filtered.map(a => (
            <button
              key={a.id}
              type="button"
              onClick={() => { onChange(a.id); setOpen(false); setSearch(""); }}
              className="w-full text-left px-3 py-2 hover:bg-accent border-b last:border-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">#{a.numero} {a.nombre ? `(${a.nombre})` : ""}</span>
                <span className="text-[10px] text-muted-foreground">{ESPECIES[a.especie] || ""}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {a.raza ? `${a.raza} · ` : ""}{fincaMap[a.finca_id] || "Sin finca"} · {loteMap[a.lote_id] || "Sin lote"} · {a.sexo || ""}
              </p>
            </button>
          ))}
        </div>
      )}
      {open && !selectedAnimal && filtered.length === 0 && search && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg p-3 text-sm text-muted-foreground">
          No se encontraron animales{especie ? ` para ${ESPECIES[especie] || especie}` : ""}
        </div>
      )}
    </div>
  );
}