import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Bug as Horse, Heart, Baby, Calendar, AlertTriangle, TrendingUp,
  Eye, Activity, GitBranch
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import EstadoReproductivoBadge from "@/components/caballos/EstadoReproductivoBadge";
import {
  ESTADO_REPRODUCTIVO, calcDiasFaltantesParto, calcFechaRevisionPreñez,
  calcFechaDesteteSugerida, ALERTAS_DEFAULT
} from "@/lib/caballos";

export default function CaballosDashboard() {
  const [filtroFinca, setFiltroFinca] = useState("all");
  const [filtroEstado, setFiltroEstado] = useState("all");

  const { data: yeguas = [] } = useQuery({
    queryKey: ["yeguas"],
    queryFn: () => base44.entities.Yegua.list(),
  });

  const { data: crias = [] } = useQuery({
    queryKey: ["crias"],
    queryFn: () => base44.entities.Cria.list(),
  });

  const { data: inseminaciones = [] } = useQuery({
    queryKey: ["inseminaciones"],
    queryFn: () => base44.entities.Inseminacion.list(),
  });

  const { data: fincas = [] } = useQuery({
    queryKey: ["fincas"],
    queryFn: () => base44.entities.Finca.list(),
  });

  // Aplicar filtros
  const yeguasFiltradas = yeguas.filter(y => {
    if (filtroFinca !== "all" && y.finca_id !== filtroFinca) return false;
    if (filtroEstado !== "all" && y.estado_reproductivo !== filtroEstado) return false;
    return true;
  });

  const criasFiltradas = crias.filter(c => {
    if (filtroFinca !== "all" && c.finca_id !== filtroFinca) return false;
    return true;
  });

  // Estadísticas
  const totalYeguas = yeguasFiltradas.length;
  const yeguasVacias = yeguasFiltradas.filter(y => y.estado_reproductivo === "vacia").length;
  const yeguasInseminadas = yeguasFiltradas.filter(y => y.estado_reproductivo === "inseminada").length;
  const yeguasPreñadas = yeguasFiltradas.filter(y => y.estado_reproductivo === "preñada").length;
  const yeguasParidas = yeguasFiltradas.filter(y => y.estado_reproductivo === "parida").length;

  const criasNacidas = criasFiltradas.length;
  const criasDestetadas = criasFiltradas.filter(c => c.estado === "destetada").length;
  const criasLactantes = criasFiltradas.filter(c => c.estado === "lactante").length;

  const today = new Date().toISOString().split("T")[0];

  // Próximos partos (fecha probable dentro de 30 días)
  const proximosPartos = yeguasFiltradas.filter(y => {
    if (!y.fecha_probable_parto) return false;
    const dias = calcDiasFaltantesParto(y.fecha_probable_parto);
    return dias >= 0 && dias <= ALERTAS_DEFAULT.dias_alerta_parto;
  });

  // Partos vencidos (fecha probable ya pasó)
  const partosVencidos = yeguasFiltradas.filter(y => {
    if (!y.fecha_probable_parto) return false;
    return y.fecha_probable_parto < today;
  });

  // Yeguas pendientes de revisión de preñez
  const pendientesRevision = yeguasFiltradas.filter(y => {
    if (y.estado_reproductivo !== "inseminada" || !y.fecha_ultima_inseminacion) return false;
    const fechaRevision = calcFechaRevisionPreñez(y.fecha_ultima_inseminacion);
    return fechaRevision <= today;
  });

  // Próximos destetes (crías lactantes próximas a destete)
  const proximosDestetes = criasFiltradas.filter(c => {
    if (c.estado !== "lactante" || !c.fecha_nacimiento) return false;
    const fechaDestete = calcFechaDesteteSugerida(c.fecha_nacimiento);
    const dias = calcDiasFaltantesParto(fechaDestete);
    return dias >= 0 && dias <= 30;
  });

  const fincaNombre = (id) => fincas.find(f => f.id === id)?.nombre || "Sin finca";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reproducción de Yeguas"
        subtitle="Control reproductivo simple y visual"
        actionLabel="Nueva Yegua"
        onAction={() => window.location.href = "/caballos/yeguas/nueva"}
      />

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/caballos/yeguas">
          <Card className="p-4 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98]">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Horse className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium">Yeguas</span>
            </div>
          </Card>
        </Link>
        <Link to="/caballos/inseminacion/nueva">
          <Card className="p-4 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98]">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium">Inseminar</span>
            </div>
          </Card>
        </Link>
        <Link to="/caballos/parto/nuevo">
          <Card className="p-4 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98]">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Baby className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium">Registrar Parto</span>
            </div>
          </Card>
        </Link>
        <Link to="/caballos/calendario">
          <Card className="p-4 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98]">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium">Calendario</span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={filtroFinca} onValueChange={setFiltroFinca}>
          <SelectTrigger className="w-44">
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
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(ESTADO_REPRODUCTIVO).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total yeguas"
          value={totalYeguas}
          subtitle={`${yeguasVacias} vacías`}
          icon={Horse}
          color="primary"
        />
        <StatCard
          title="Inseminadas"
          value={yeguasInseminadas}
          subtitle="Pendiente confirmar"
          icon={Heart}
          color="blue"
        />
        <StatCard
          title="Preñadas"
          value={yeguasPreñadas}
          subtitle={`${proximosPartos.length} próximas a parir`}
          icon={Activity}
          color="success"
        />
        <StatCard
          title="Paridas"
          value={yeguasParidas}
          subtitle={`${criasLactantes} crías lactantes`}
          icon={Baby}
          color="accent"
        />
        <StatCard
          title="Crías nacidas"
          value={criasNacidas}
          subtitle={`${criasDestetadas} destetadas`}
          icon={GitBranch}
          color="purple"
        />
        <StatCard
          title="Próximos partos"
          value={proximosPartos.length}
          subtitle="En 30 días o menos"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Pendientes revisión"
          value={pendientesRevision.length}
          subtitle="Confirmar preñez"
          icon={Eye}
          color="accent"
        />
        <StatCard
          title="Próximos destetes"
          value={proximosDestetes.length}
          subtitle="En 30 días o menos"
          icon={TrendingUp}
          color="success"
        />
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {partosVencidos.length > 0 && (
          <Card className="p-4 border-l-4 border-l-red-500">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">{partosVencidos.length} yegua(s) con parto vencido</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {partosVencidos.slice(0, 3).map(y => y.nombre).join(", ")}
                </p>
              </div>
            </div>
          </Card>
        )}
        {pendientesRevision.length > 0 && (
          <Card className="p-4 border-l-4 border-l-amber-400">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">{pendientesRevision.length} yegua(s) por revisar preñez</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pendientesRevision.slice(0, 3).map(y => y.nombre).join(", ")}
                </p>
              </div>
            </div>
          </Card>
        )}
        {proximosPartos.length > 0 && (
          <Card className="p-4 border-l-4 border-l-blue-400">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">{proximosPartos.length} parto(s) próximo(s)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {proximosPartos.slice(0, 3).map(y => y.nombre).join(", ")}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Lista rápida de yeguas */}
      {yeguasFiltradas.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-lg">Yeguas ({yeguasFiltradas.length})</h2>
            <Link to="/caballos/yeguas">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todas
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {yeguasFiltradas.slice(0, 5).map(yegua => {
              const diasParto = yegua.fecha_probable_parto ? calcDiasFaltantesParto(yegua.fecha_probable_parto) : null;
              return (
                <Link
                  key={yegua.id}
                  to={`/caballos/yeguas/${yegua.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Horse className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{yegua.nombre}</p>
                      <p className="text-xs text-muted-foreground">{fincaNombre(yegua.finca_id)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {diasParto !== null && diasParto >= 0 && (
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        Parto en {diasParto}d
                      </span>
                    )}
                    <EstadoReproductivoBadge estado={yegua.estado_reproductivo} />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}