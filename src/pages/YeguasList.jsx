import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Search, LayoutGrid, Table as TableIcon, Eye } from "lucide-react";
import { HorseIcon } from "@/components/shared/SpeciesIcons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import EstadoReproductivoBadge from "@/components/caballos/EstadoReproductivoBadge";
import DeleteConfirmButton from "@/components/shared/DeleteConfirmButton";
import { ESTADO_REPRODUCTIVO, TIPO_YEGUA, TIPO_YEGUA_COLORS, calcDiasFaltantesParto } from "@/lib/caballos";
import { toast } from "sonner";

export default function YeguasList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroFinca, setFiltroFinca] = useState("all");
  const [viewMode, setViewMode] = useState("cards");

  const { data: yeguas = [] } = useQuery({
    queryKey: ["yeguas"],
    queryFn: () => base44.entities.Yegua.list(),
  });

  const { data: fincas = [] } = useQuery({
    queryKey: ["fincas"],
    queryFn: () => base44.entities.Finca.list(),
  });

  const { data: inseminaciones = [] } = useQuery({
    queryKey: ["inseminaciones"],
    queryFn: () => base44.entities.Inseminacion.list(),
  });

  const fincaNombre = (id) => fincas.find(f => f.id === id)?.nombre || "";

  const ultimaInseminacion = (yeguaId) => {
    const insems = inseminaciones
      .filter(i => i.yegua_id === yeguaId)
      .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
    return insems[0] || null;
  };

  // Filtros
  const yeguasFiltradas = yeguas.filter(y => {
    if (filtroEstado !== "all" && y.estado_reproductivo !== filtroEstado) return false;
    if (filtroTipo !== "all") {
      if (filtroTipo === "sin_tipo") {
        if (y.tipo_yegua) return false;
      } else if (y.tipo_yegua !== filtroTipo) return false;
    }
    if (filtroFinca !== "all" && y.finca_id !== filtroFinca) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!y.nombre?.toLowerCase().includes(s) && !y.numero?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yeguas"
        subtitle={`${yeguasFiltradas.length} de ${yeguas.length} yeguas`}
        actionLabel="Nueva Yegua"
        onAction={() => navigate("/caballos/yeguas/nueva")}
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroFinca} onValueChange={setFiltroFinca}>
          <SelectTrigger className="w-36 sm:w-40">
            <SelectValue placeholder="Finca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fincas</SelectItem>
            {fincas.map(f => (
              <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-36 sm:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(ESTADO_REPRODUCTIVO).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-36 sm:w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(TIPO_YEGUA).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
            <SelectItem value="sin_tipo">Sin tipo definido</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-md overflow-hidden">
          <Button
            type="button"
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
            className="rounded-none"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="rounded-none"
          >
            <TableIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Contenido */}
      {yeguasFiltradas.length === 0 ? (
        <EmptyState
          icon={HorseIcon}
          title="No hay yeguas registradas"
          description="Empieza registrando tu primera yegua para llevar el control reproductivo"
          actionLabel="Nueva Yegua"
          onAction={() => navigate("/caballos/yeguas/nueva")}
        />
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {yeguasFiltradas.map(yegua => {
            const ultInsem = ultimaInseminacion(yegua.id);
            const diasParto = yegua.fecha_probable_parto ? calcDiasFaltantesParto(yegua.fecha_probable_parto) : null;
            return (
              <Card
                key={yegua.id}
                className="p-4 hover:shadow-lg transition-all cursor-pointer active:scale-[0.99]"
                onClick={() => navigate(`/caballos/yeguas/${yegua.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <HorseIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold">{yegua.nombre}</h3>
                      {yegua.numero && <p className="text-xs text-muted-foreground">#{yegua.numero}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {yegua.tipo_yegua && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${TIPO_YEGUA_COLORS[yegua.tipo_yegua] || "bg-slate-100 text-slate-600"}`}>
                        {TIPO_YEGUA[yegua.tipo_yegua] || "Sin tipo"}
                      </span>
                    )}
                    {!yegua.tipo_yegua && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-500">Sin tipo</span>
                    )}
                    <EstadoReproductivoBadge estado={yegua.estado_reproductivo} />
                    <DeleteConfirmButton entityName="Yegua" recordId={yegua.id} recordLabel={`la yegua "${yegua.nombre}"`} queryKeysToInvalidate={["yeguas"]} />
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  {fincaNombre(yegua.finca_id) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Finca:</span>
                      <span className="font-medium">{fincaNombre(yegua.finca_id)}</span>
                    </div>
                  )}
                  {ultInsem && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Últ. inseminación:</span>
                      <span className="font-medium">{ultInsem.fecha}</span>
                    </div>
                  )}
                  {yegua.fecha_probable_parto && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parto probable:</span>
                      <span className={`font-medium ${diasParto < 7 ? 'text-red-600' : diasParto < 30 ? 'text-amber-600' : ''}`}>
                        {yegua.fecha_probable_parto}
                        {diasParto !== null && diasParto >= 0 && ` (${diasParto}d)`}
                      </span>
                    </div>
                  )}
                  {yegua.fecha_ultimo_parto && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Últ. parto:</span>
                      <span className="font-medium">{yegua.fecha_ultimo_parto}</span>
                    </div>
                  )}
                </div>

                {yegua.observaciones && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2 italic">"{yegua.observaciones}"</p>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Finca</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Últ. Inseminación</TableHead>
                <TableHead>Parto probable</TableHead>
                <TableHead>Últ. parto</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yeguasFiltradas.map(yegua => {
                const ultInsem = ultimaInseminacion(yegua.id);
                const diasParto = yegua.fecha_probable_parto ? calcDiasFaltantesParto(yegua.fecha_probable_parto) : null;
                return (
                  <TableRow
                    key={yegua.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/caballos/yeguas/${yegua.id}`)}
                  >
                    <TableCell className="font-medium">
                      {yegua.nombre}
                      {yegua.numero && <span className="text-xs text-muted-foreground block">#{yegua.numero}</span>}
                    </TableCell>
                    <TableCell className="text-sm">{fincaNombre(yegua.finca_id) || "-"}</TableCell>
                    <TableCell><EstadoReproductivoBadge estado={yegua.estado_reproductivo} /></TableCell>
                    <TableCell className="text-sm">
                      {yegua.tipo_yegua ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${TIPO_YEGUA_COLORS[yegua.tipo_yegua] || "bg-slate-100 text-slate-600"}`}>
                          {TIPO_YEGUA[yegua.tipo_yegua]}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Sin tipo</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{ultInsem?.fecha || "-"}</TableCell>
                    <TableCell className="text-sm">
                      {yegua.fecha_probable_parto ? (
                        <span className={diasParto < 7 ? 'text-red-600 font-medium' : diasParto < 30 ? 'text-amber-600 font-medium' : ''}>
                          {yegua.fecha_probable_parto}
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-sm">{yegua.fecha_ultimo_parto || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <DeleteConfirmButton entityName="Yegua" recordId={yegua.id} recordLabel={`la yegua "${yegua.nombre}"`} queryKeysToInvalidate={["yeguas"]} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}