import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Heart, Eye, Baby, GitBranch
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import { calcFechaDesteteSugerida, ALERTAS_DEFAULT } from "@/lib/caballos";

export default function CalendarioReproductivo() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: yeguas = [] } = useQuery({
    queryKey: ["yeguas"],
    queryFn: () => base44.entities.Yegua.list(),
  });

  const { data: inseminaciones = [] } = useQuery({
    queryKey: ["inseminaciones"],
    queryFn: () => base44.entities.Inseminacion.list(),
  });

  const { data: confirmaciones = [] } = useQuery({
    queryKey: ["confirmaciones"],
    queryFn: () => base44.entities.ConfirmacionPreñez.list(),
  });

  const { data: partos = [] } = useQuery({
    queryKey: ["partos"],
    queryFn: () => base44.entities.Parto.list(),
  });

  const { data: crias = [] } = useQuery({
    queryKey: ["crias"],
    queryFn: () => base44.entities.Cria.list(),
  });

  const yeguaNombre = (id) => yeguas.find(y => y.id === id)?.nombre || "?";

  // Generar eventos del calendario
  const eventos = useMemo(() => {
    const events = [];

    // Inseminaciones
    inseminaciones.forEach(i => {
      if (i.fecha) {
        events.push({
          fecha: i.fecha,
          titulo: `Inseminación: ${yeguaNombre(i.yegua_id)}`,
          tipo: "inseminacion",
          icon: Heart,
          color: "blue",
        });
      }
    });

    // Revisiones de preñez pendientes (inseminación + 15 días)
    inseminaciones.filter(i => i.resultado === "pendiente").forEach(i => {
      if (i.fecha) {
        const fechaRevision = new Date(i.fecha);
        fechaRevision.setDate(fechaRevision.getDate() + ALERTAS_DEFAULT.dias_revisar_preñez_min);
        events.push({
          fecha: fechaRevision.toISOString().split("T")[0],
          titulo: `Revisar preñez: ${yeguaNombre(i.yegua_id)}`,
          tipo: "revision",
          icon: Eye,
          color: "amber",
        });
      }
    });

    // Confirmaciones de preñez
    confirmaciones.forEach(c => {
      if (c.fecha) {
        events.push({
          fecha: c.fecha,
          titulo: `Preñez confirmada: ${yeguaNombre(c.yegua_id)}`,
          tipo: "confirmacion",
          icon: Eye,
          color: "green",
        });
      }
    });

    // Fechas probables de parto
    yeguas.forEach(y => {
      if (y.fecha_probable_parto) {
        events.push({
          fecha: y.fecha_probable_parto,
          titulo: `Parto probable: ${y.nombre}`,
          tipo: "parto_probable",
          icon: Baby,
          color: "red",
        });
      }
    });

    // Partos registrados
    partos.forEach(p => {
      if (p.fecha) {
        events.push({
          fecha: p.fecha,
          titulo: `Parto: ${yeguaNombre(p.yegua_id)}`,
          tipo: "parto",
          icon: Baby,
          color: "green",
        });
      }
    });

    // Destetes sugeridos (crías lactantes)
    crias.filter(c => c.estado === "lactante").forEach(c => {
      if (c.fecha_nacimiento) {
        const fechaDestete = calcFechaDesteteSugerida(c.fecha_nacimiento);
        events.push({
          fecha: fechaDestete,
          titulo: `Destete sugerido: ${c.nombre || "Cría de " + yeguaNombre(c.madre_id)}`,
          tipo: "destete",
          icon: GitBranch,
          color: "purple",
        });
      }
    });

    // Destetes registrados
    crias.filter(c => c.estado === "destetada").forEach(c => {
      if (c.fecha_destete) {
        events.push({
          fecha: c.fecha_destete,
          titulo: `Destete: ${c.nombre || "Cría de " + yeguaNombre(c.madre_id)}`,
          tipo: "destete_registrado",
          icon: GitBranch,
          color: "green",
        });
      }
    });

    return events;
  }, [inseminaciones, confirmaciones, partos, yeguas, crias]);

  const dotColorClasses = {
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    green: "bg-emerald-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };

  const borderClasses = {
    blue: "border-blue-500",
    amber: "border-amber-500",
    green: "border-emerald-500",
    red: "border-red-500",
    purple: "border-purple-500",
  };

  const iconColorClasses = {
    blue: "text-blue-500",
    amber: "text-amber-500",
    green: "text-emerald-500",
    red: "text-red-500",
    purple: "text-purple-500",
  };

  // Generar días del mes
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, dateStr, events: eventos.filter(e => e.fecha === dateStr) });
  }

  const monthName = currentMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const today = new Date().toISOString().split("T")[0];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const goToday = () => setCurrentMonth(new Date());

  // Próximos eventos (ordenados por fecha)
  const proximosEventos = eventos
    .filter(e => e.fecha >= today)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader title="Calendario Reproductivo" subtitle="Eventos de inseminación, preñez, partos y destetes" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

            <Button variant="ghost" size="sm" onClick={goToday} className="mb-3 w-full">
              Ir a hoy
            </Button>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Días */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((dayObj, idx) => {
                if (!dayObj) {
                  return <div key={idx} className="aspect-square" />;
                }
                const isToday = dayObj.dateStr === today;
                const hasEvents = dayObj.events.length > 0;

                return (
                  <div
                    key={idx}
                    className={`aspect-square border rounded-lg p-1 flex flex-col items-center justify-start text-sm relative ${
                      isToday ? 'border-primary border-2' : 'border-border'
                    } ${hasEvents ? 'bg-muted/30' : ''}`}
                  >
                    <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {dayObj.day}
                    </span>
                    {hasEvents && (
                      <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                        {dayObj.events.slice(0, 3).map((event, eIdx) => (
                          <div
                            key={eIdx}
                            className={`w-1.5 h-1.5 rounded-full ${dotColorClasses[event.color]}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Inseminación</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Revisión</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Confirmada/Parto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Parto próximo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>Destete</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Próximos eventos */}
        <div>
          <Card className="p-4">
            <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" /> Próximos eventos
            </h2>
            {proximosEventos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay eventos próximos</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {proximosEventos.map((event, idx) => {
                  const Icon = event.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border-l-4 ${borderClasses[event.color]} bg-muted/30`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColorClasses[event.color]}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.titulo}</p>
                          <p className="text-xs text-muted-foreground">{event.fecha}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}