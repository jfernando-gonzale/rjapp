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

export default function Pesajes() {
  const [filterFinca, setFilterFinca] = useState("all");

  const { data: pesajes = [], isLoading } = useQuery({ queryKey: ["pesajes"], queryFn: () => base44.entities.Pesaje.list("-fecha", 200) });
  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });

  const animalMap = useMemo(() => {
    const map = {};
    animals.forEach(a => { map[a.id] = a; });
    return map;
  }, [animals]);

  const filtered = filterFinca === "all" ? pesajes : pesajes.filter(p => p.finca_id === filterFinca);

  return (
    <div>
      <PageHeader title="Pesajes" subtitle={`${filtered.length} registros`}>
        <Select value={filterFinca} onValueChange={setFilterFinca}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Finca" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {fincas.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Link to="/pesajes/nuevo">
          <Button className="gap-2"><Plus className="w-4 h-4" /> Nuevo Pesaje</Button>
        </Link>
      </PageHeader>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={Weight} title="Sin pesajes" description="Registra el primer pesaje" actionLabel="Nuevo Pesaje" onAction={() => window.location.href = "/pesajes/nuevo"} />
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const animal = animalMap[p.animal_id];
            return (
              <Card key={p.id} className="p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Weight className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link to={`/animales/${p.animal_id}`} className="font-medium hover:underline">
                          #{animal?.numero || "—"}
                        </Link>
                        <span className="text-lg font-bold">{formatWeight(p.peso)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(p.fecha), "dd MMM yyyy", { locale: es })}
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