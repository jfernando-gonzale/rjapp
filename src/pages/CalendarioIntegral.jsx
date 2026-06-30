import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Plus, Filter, X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CATEGORIAS, ESTADO_LABELS, ESPECIE_LABELS,
  DOT_COLORS, BORDER_COLORS, TEXT_COLORS, BG_SOFT,
} from "@/lib/calendario";
import { construirEventos } from "@/components/calendario/eventBuilder";
import EventoCalendarioForm from "@/components/calendario/EventoCalendarioForm";
import EventoDetalleDialog from "@/components/calendario/EventoDetalleDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CalendarioIntegral() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [detalleEvento, setDetalleEvento] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editValues, setEditValues] = useState(null);

  // Filtros
  const [fEspecie, setFEspecie] = useState("all");
  const [fTipo, setFTipo] = useState("all");
  const [fFinca, setFFinca] = useState("all");
  const [fEstado, setFEstado] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Datos
  const { data: eventosManuales = [] } = useQuery({
    queryKey: ["eventos_calendario"],
    queryFn: () => base44.entities.EventoCalendario.list("-fecha", 500),
  });
  const { data: yeguas = [] } = useQuery({ queryKey: ["yeguas"], queryFn: () => base44.entities.Yegua.list() });
  const { data: inseminaciones = [] } = useQuery({ queryKey: ["inseminaciones"], queryFn: () => base44.entities.Inseminacion.list() });
  const { data: confirmaciones = [] } = useQuery({ queryKey: ["confirmaciones"], queryFn: () => base44.entities.ConfirmacionPreñez.list() });
  const { data: partos = [] } = useQuery({ queryKey: ["partos"], queryFn: () => base44.entities.Parto.list() });
  const { data: crias = [] } = useQuery({ queryKey: ["crias"], queryFn: () => base44.entities.Cria.list() });
  const { data: tratamientos = [] } = useQuery({ queryKey: ["tratamientos"], queryFn: () => base44.entities.Tratamiento.list("-fecha", 300) });
  const { data: pesajes = [] } = useQuery({ queryKey: ["pesajes"], queryFn: () => base44.entities.Pesaje.list() });
  const { data: despachos = [] } = useQuery({ queryKey: ["despachos"], queryFn: () => base44.entities.Despacho.list() });
  const { data: colectas = [] } = useQuery({ queryKey: ["colectas"], queryFn: () => base44.entities.Colecta.list() });
  const { data: procedimientos = [] } = useQuery({ queryKey: ["procedimientos"], queryFn: () => base44.entities.Procedimiento.list("-fecha", 300) });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: animales = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });

  // Mutaciones para eventos manuales
  const createMut = useMutation({
    mutationFn: (data) => base44.entities.EventoCalendario.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eventos_calendario"] }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EventoCalendario.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eventos_calendario"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.EventoCalendario.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eventos_calendario"] }),
  });

  // Estado derivado: vencido si fecha < hoy y estado = pendiente (no persistente, solo visual)
  const allEventos = useMemo(() => {
    const events = construirEventos({
      yeguas, inseminaciones, confirmaciones, partos, crias,
      tratamientos, pesajes, despachos, colectas, lotes, fincas, animales,
      eventosManuales, procedimientos,
    });
    const today = new Date().toISOString().split("T")[0];
    return events.map((e) =>
      e.estado === "pendiente" && e.fecha < today ? { ...e, estado: "vencido" } : e
    );
  }, [yeguas, inseminaciones, confirmaciones, partos, crias, tratamientos, pesajes, despachos, colectas, lotes, fincas, animales, eventosManuales, procedimientos]);

  // Aplicar filtros
  const eventosFiltrados = useMemo(() => {
    return allEventos.filter((e) => {
      if (fEspecie !== "all" && e.especie && e.especie !== "general" && e.especie !== fEspecie) return false;
      if (fTipo !== "all" && e.tipo_evento !== fTipo) return false;
      if (fFinca !== "all" && e.finca_id !== fFinca) return false;
      if (fEstado !== "all" && e.estado !== fEstado) return false;
      return true;
    });
  }, [allEventos, fEspecie, fTipo, fFinca, fEstado]);

  // Días del mes
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ day: d, dateStr, events: eventosFiltrados.filter((e) => e.fecha === dateStr) });
  }

  const monthName = currentMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const today = new Date().toISOString().split("T")[0];
  const eventosDelDia = selectedDate ? eventosFiltrados.filter((e) => e.fecha === selectedDate) : [];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const goToday = () => { setCurrentMonth(new Date()); setSelectedDate(today); };

  // Próximos eventos (próximos 15, incluye hoy)
  const proximos = useMemo(() => {
    return [...eventosFiltrados]
      .filter((e) => e.fecha >= today)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(0, 15);
  }, [eventosFiltrados, today]);

  // Vencidos
  const vencidos = useMemo(() => {
    return [...eventosFiltrados]
      .filter((e) => e.estado === "vencido" || (e.fecha < today && (e.estado === "pendiente" || e.estado === "vencido")))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 10);
  }, [eventosFiltrados, today]);

  const handleCrearEvento = async (data) => {
    if (editValues?.id) {
      await updateMut.mutateAsync({ id: editValues.id, data });
    } else {
      await createMut.mutateAsync(data);
    }
    setEditValues(null);
  };

  const handleMarcarEstado = async (evento, nuevoEstado) => {
    // Solo persistimos si es evento manual (no derivado)
    if (!evento.es_derivado && evento.origen_id) {
      await updateMut.mutateAsync({ id: evento.origen_id, data: { estado: nuevoEstado } });
    }
    // Para derivados solo cerramos el modal (estado es visual/derivado)
    setDetalleOpen(false);
  };

  const handleEditar = (evento) => {
    if (evento.es_derivado) return;
    const ev = eventosManuales.find((x) => x.id === evento.origen_id);
    setEditValues(ev);
    setDetalleOpen(false);
    setFormOpen(true);
  };

  const handleEliminar = async (evento) => {
    if (!evento.es_derivado && evento.origen_id) {
      await deleteMut.mutateAsync(evento.origen_id);
    }
    setDetalleOpen(false);
  };

  const hayFiltrosActivos = fEspecie !== "all" || fTipo !== "all" || fFinca !== "all" || fEstado !== "all";
  const limpiarFiltros = () => {
    setFEspecie("all"); setFTipo("all"); setFFinca("all"); setFEstado("all");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendario / Alertas"
        subtitle="Eventos de reproducción, tratamientos, pesajes, despachos y tareas de finca"
        actionLabel="Nuevo evento"
        onAction={() => { setEditValues(null); setFormOpen(true); }}
      />

      {/* Filtros superiores */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
          <Filter className="w-4 h-4" /> Filtros
        </Button>
        {hayFiltrosActivos && (
          <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="gap-1 text-destructive">
            <X className="w-3 h-3" /> Limpiar
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{eventosFiltrados.length} eventos visibles</span>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Especie</label>
              <Select value={fEspecie} onValueChange={setFEspecie}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="bovino">Bovinos</SelectItem>
                  <SelectItem value="ovino">Ovinos</SelectItem>
                  <SelectItem value="equino">Equinos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Tipo de evento</label>
              <Select value={fTipo} onValueChange={setFTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(CATEGORIAS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Finca</label>
              <Select value={fFinca} onValueChange={setFFinca}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {fincas.map((f) => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Estado</label>
              <Select value={fEstado} onValueChange={setFEstado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}

      {/* Alerta vencidos */}
      {vencidos.length > 0 && (
        <Card className="p-3 border-l-4 border-l-red-500 bg-red-50/50">
          <p className="text-sm font-medium text-red-700">
            ⚠️ {vencidos.length} evento(s) vencido(s)
          </p>
          <p className="text-xs text-red-600/80 mt-0.5">
            {vencidos.slice(0, 3).map((e) => e.titulo).join(" · ")}
            {vencidos.length > 3 && ` y ${vencidos.length - 3} más`}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendario */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="font-heading font-semibold text-lg capitalize">{monthName}</h2>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={goToday} className="mb-3 w-full">Ir a hoy</Button>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((dayObj, idx) => {
                if (!dayObj) return <div key={idx} className="aspect-square" />;
                const isToday = dayObj.dateStr === today;
                const isSelected = dayObj.dateStr === selectedDate;
                const hasEvents = dayObj.events.length > 0;
                const hasVencido = dayObj.events.some((e) => e.estado === "vencido");
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(dayObj.dateStr)}
                    className={`aspect-square border rounded-lg p-1 flex flex-col items-center justify-start text-sm relative transition-colors hover:bg-muted/50 ${
                      isToday ? "border-primary border-2" : "border-border"
                    } ${isSelected ? "bg-primary/10" : ""} ${hasVencido ? "bg-red-50/50" : hasEvents ? "bg-muted/30" : ""}`}
                  >
                    <span className={`text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                      {dayObj.day}
                    </span>
                    {hasEvents && (
                      <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                        {dayObj.events.slice(0, 4).map((event, eIdx) => (
                          <div key={eIdx} className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[event.color] || DOT_COLORS.gray}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              {Object.entries(CATEGORIAS).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${DOT_COLORS[v.color]}`} />
                  <span>{v.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Vencido</span>
              </div>
            </div>
          </Card>

          {/* Eventos del día seleccionado */}
          {selectedDate && (
            <Card className="p-4 mt-4">
              <h3 className="font-heading font-semibold mb-3">
                {format(new Date(selectedDate + "T00:00:00"), "EEEE d 'de' MMMM", { locale: es })}
              </h3>
              {eventosDelDia.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">Sin eventos para este día</p>
              ) : (
                <div className="space-y-2">
                  {eventosDelDia.map((e) => {
                    const Icon = e.icon;
                    return (
                      <button
                        key={e.id}
                        onClick={() => { setDetalleEvento(e); setDetalleOpen(true); }}
                        className={`w-full text-left p-3 rounded-lg border-l-4 ${BORDER_COLORS[e.color] || BORDER_COLORS.gray} ${BG_SOFT[e.color] || "bg-muted/30"} hover:opacity-80 transition-opacity`}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${TEXT_COLORS[e.color] || TEXT_COLORS.gray}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{e.titulo}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>{ESPECIE_LABELS[e.especie] || ""}</span>
                              {e.finca && <span>· {e.finca}</span>}
                              {e.estado === "vencido" && <span className="text-red-600 font-medium">· Vencido</span>}
                              {e.estado === "completado" && <span className="text-emerald-600">· Completado</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Panel próximos eventos */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-heading font-semibold text-base mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> Próximos eventos
            </h2>
            {proximos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay eventos próximos</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {proximos.map((e) => {
                  const Icon = e.icon;
                  return (
                    <div key={e.id} className={`p-2.5 rounded-lg border-l-4 ${BORDER_COLORS[e.color] || BORDER_COLORS.gray} ${BG_SOFT[e.color] || "bg-muted/30"}`}>
                      <div className="flex items-start gap-2">
                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${TEXT_COLORS[e.color] || TEXT_COLORS.gray}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{e.titulo}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(e.fecha + "T00:00:00"), "dd MMM yyyy", { locale: es })}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {vencidos.length > 0 && (
            <Card className="p-4 border-l-4 border-l-red-500">
              <h2 className="font-heading font-semibold text-base text-red-700 mb-3">Vencidos</h2>
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {vencidos.map((e) => {
                  const Icon = e.icon;
                  return (
                    <div key={e.id} className="p-2.5 rounded-lg border-l-4 border-red-500 bg-red-50/40">
                      <div className="flex items-start gap-2">
                        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{e.titulo}</p>
                          <p className="text-xs text-red-600/70">{format(new Date(e.fecha + "T00:00:00"), "dd MMM yyyy", { locale: es })}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      <EventoCalendarioForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCrearEvento}
        initialValues={editValues}
        fincas={fincas}
        lotes={lotes}
        animales={animales}
      />
      <EventoDetalleDialog
        evento={detalleEvento}
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        onMarcarEstado={handleMarcarEstado}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
      />
    </div>
  );
}