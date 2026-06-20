import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Baby, Search, GitBranch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import EstadoCriaBadge from "@/components/caballos/EstadoCriaBadge";
import { ESTADO_CRIA, SEXO_CRIA, calcEdadDestete, calcFechaDesteteSugerida } from "@/lib/caballos";
import { daysBetween } from "@/lib/helpers";

export default function CriasList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");

  const { data: crias = [] } = useQuery({
    queryKey: ["crias"],
    queryFn: () => base44.entities.Cria.list(),
  });

  const { data: yeguas = [] } = useQuery({
    queryKey: ["yeguas"],
    queryFn: () => base44.entities.Yegua.list(),
  });

  const madreNombre = (id) => yeguas.find(y => y.id === id)?.nombre || "?";

  const criasFiltradas = crias.filter(c => {
    if (filtroEstado !== "all" && c.estado !== filtroEstado) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!c.nombre?.toLowerCase().includes(s) && !madreNombre(c.madre_id).toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crías"
        subtitle={`${criasFiltradas.length} de ${crias.length} crías`}
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o madre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(ESTADO_CRIA).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {criasFiltradas.length === 0 ? (
        <EmptyState
          icon={Baby}
          title="No hay crías registradas"
          description="Las crías se crean automáticamente al registrar un parto exitoso"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {criasFiltradas.map(c => {
            const edadDias = c.fecha_nacimiento ? daysBetween(c.fecha_nacimiento, today) : null;
            const fechaDesteteSugerida = c.estado === "lactante" && c.fecha_nacimiento ? calcFechaDesteteSugerida(c.fecha_nacimiento) : null;
            const diasParaDestete = fechaDesteteSugerida ? daysBetween(today, fechaDesteteSugerida) : null;

            return (
              <Card key={c.id} className="p-4 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Baby className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold">{c.nombre || "Sin nombre"}</h3>
                      <p className="text-xs text-muted-foreground">Madre: {madreNombre(c.madre_id)}</p>
                    </div>
                  </div>
                  <EstadoCriaBadge estado={c.estado} />
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nacimiento:</span>
                    <span className="font-medium">{c.fecha_nacimiento}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sexo:</span>
                    <span className="font-medium">{SEXO_CRIA[c.sexo]}</span>
                  </div>
                  {edadDias !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Edad:</span>
                      <span className="font-medium">{edadDias} días ({(edadDias / 30).toFixed(1)} meses)</span>
                    </div>
                  )}
                  {c.estado === "lactante" && fechaDesteteSugerida && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Destete sugerido:</span>
                      <span className={`font-medium ${diasParaDestete <= 30 ? 'text-amber-600' : ''}`}>
                        {fechaDesteteSugerida}
                      </span>
                    </div>
                  )}
                  {c.estado === "destetada" && c.fecha_destete && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Destetada:</span>
                      <span className="font-medium">{c.fecha_destete} ({c.edad_destete_dias}d)</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}