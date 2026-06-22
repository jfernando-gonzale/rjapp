import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Weight, Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import GainIndicator from "@/components/shared/GainIndicator";
import { formatWeight } from "@/lib/helpers";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ESPECIE_LABELS = { bovino: "🐄 Bovino", ovino: "🐑 Ovino", equino: "🐴 Equino" };
const ESPECIE_COLORS = {
  bovino: "bg-amber-100 text-amber-800",
  ovino: "bg-green-100 text-green-800",
  equino: "bg-blue-100 text-blue-800",
};

export default function Pesajes() {
  const [filterEspecie, setFilterEspecie] = useState("all");
  const [filterFinca, setFilterFinca] = useState("all");
  const [filterLote, setFilterLote] = useState("all");

  const { data: pesajes = [], isLoading } = useQuery({ queryKey: ["pesajes"], queryFn: () => base44.entities.Pesaje.list("-fecha", 200) });
  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });

  const animalMap = useMemo(() => {
    const map = {};
    animals.forEach(a => { map[a.id] = a; });
    return map;
  }, [animals]);

  const filteredLotes = filterFinca === "all" ? lotes : lotes.filter(l => l.finca_id === filterFinca);

  const filtered = useMemo(() => pesajes.filter(p => {
    if (filterFinca !== "all" && p.finca_id !== filterFinca) return false;
    if (filterLote !== "all" && p.lote_id !== filterLote) return false;
    if (filterEspecie !== "all") {
      const animal = animalMap[p.animal_id];
      const especie = animal?.especie || "bovino";
      if (especie !== filterEspecie) return false;
    }
    return true;
  }), [pesajes, filterFinca, filterLote, filterEspecie, animalMap]);

  return (
    <div>
      <PageHeader title="Pesajes" subtitle={`${filtered.length} registros`}>
        <Link to="/pesajes/nuevo">
          <Button className="gap-2"><Plus className="w-4 h-4" /> Nuevo Pesaje</Button>
        </Link>
      </PageHeader>

      {/* Filtro especie */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          { key: "all", label: "Todas las especies" },
          { key: "bovino", label: "🐄 Bovinos" },
          { key: "ovino", label: "🐑 Ovinos" },
          { key: "equino", label: "🐴 Equinos" },
        ].map(e => (
          <button key={e.key} onClick={() => setFilterEspecie(e.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filterEspecie === e.key ? "bg-amber-500 text-black border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
            }`}>{e.label}</button>
        ))}
      </div>

      {/* Filtros finca/lote */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Select value={filterFinca} onValueChange={(v) => { setFilterFinca(v); setFilterLote("all"); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Finca" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fincas</SelectItem>
            {fincas.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterLote} onValueChange={setFilterLote}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Lote" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los lotes</SelectItem>
            {filteredLotes.map(l => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={Weight} title="Sin pesajes" description="Registra el primer pesaje" actionLabel="Nuevo Pesaje" onAction={() => window.location.href = "/pesajes/nuevo"} />
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const animal = animalMap[p.animal_id];
            const especie = animal?.especie || "bovino";
            return (
              <Card key={p.id} className="p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Weight className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/animales/${p.animal_id}`} className="font-medium hover:underline">
                          #{animal?.numero || "—"}
                        </Link>
                        <span className="text-lg font-bold">{formatWeight(p.peso)}</span>
                        {animal?.especie && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${ESPECIE_COLORS[especie] || "bg-gray-100 text-gray-600"}`}>
                            {ESPECIE_LABELS[especie]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.fecha ? format(new Date(p.fecha), "dd MMM yyyy", { locale: es }) : ""}
                        {p.diferencia_peso != null && (
                          <span className={p.diferencia_peso >= 0 ? " text-emerald-600" : " text-red-600"}>
                            {" "}• {p.diferencia_peso >= 0 ? "+" : ""}{p.diferencia_peso.toFixed(1)} kg
                          </span>
                        )}
                        {p.dias_entre_pesajes && ` • ${p.dias_entre_pesajes} días`}
                      </p>
                    </div>
                  </div>
                  {p.ganancia_diaria != null && <GainIndicator dailyGain={p.ganancia_diaria} />}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}