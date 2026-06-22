import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Scale, Syringe, ShoppingCart, Truck, Users, Baby, Calendar, Star, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency } from "@/lib/helpers";

const HorseIcon = (props) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 9 Q10 9 8 15 L8 25"/>
    <path d="M16 9 Q22 9 24 15 L24 25"/>
    <path d="M8 15 Q16 18 24 15"/>
    <circle cx="11" cy="12.5" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="21" cy="12.5" r="1.2" fill="currentColor" stroke="none"/>
    <path d="M16 9 L16 5"/>
    <path d="M16 5 Q20 3 22 5 L20 9"/>
    <path d="M13 23 Q16 25 19 23"/>
    <path d="M8 25 L8 29"/><path d="M11 25 L11 29"/>
    <path d="M21 25 L21 29"/><path d="M24 25 L24 29"/>
  </svg>
);

export default function Equinos() {
  const { data: yeguas = [] } = useQuery({ queryKey: ["yeguas"], queryFn: () => base44.entities.Yegua.list() });
  const { data: crias = [] } = useQuery({ queryKey: ["crias"], queryFn: () => base44.entities.Cria.list() });
  const { data: gastos = [] } = useQuery({ queryKey: ["gastos"], queryFn: () => base44.entities.Gasto.list() });
  const { data: ventas = [] } = useQuery({ queryKey: ["ventas"], queryFn: () => base44.entities.Venta.list() });
  const { data: despachos = [] } = useQuery({ queryKey: ["despachos"], queryFn: () => base44.entities.Despacho.list() });
  const { data: clientes = [] } = useQuery({ queryKey: ["clientes"], queryFn: () => base44.entities.Cliente.list() });
  const { data: reproductores = [] } = useQuery({ queryKey: ["reproductores"], queryFn: () => base44.entities.Reproductor.list() });
  const { data: colectas = [] } = useQuery({ queryKey: ["colectas"], queryFn: () => base44.entities.Colecta.list() });
  const { data: inconformidades = [] } = useQuery({ queryKey: ["inconformidades"], queryFn: () => base44.entities.Inconformidad.list() });

  const today = new Date().toISOString().split("T")[0];
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);
  const in30Str = in30.toISOString().split("T")[0];

  const preñadas = yeguas.filter(y => y.estado_reproductivo === "preñada");
  const paridas = yeguas.filter(y => y.estado_reproductivo === "parida");
  const inseminadas = yeguas.filter(y => y.estado_reproductivo === "inseminada");
  const partosProx = yeguas.filter(y => y.fecha_probable_parto && y.fecha_probable_parto >= today && y.fecha_probable_parto <= in30Str);
  const despachosActivos = despachos.filter(d => d.estado === "programado" || d.estado === "enviado");
  const clientesEquinos = clientes.filter(c => c.tipo_cliente === "equinos" || c.tipo_cliente === "semen_equino");
  const totalVentas = ventas.filter(v => v.especie === "equino" || v.especie === "semen_equino").reduce((s, v) => s + (v.precio_total || 0), 0);
  const totalGastos = gastos.filter(g => g.especie === "equino").reduce((s, g) => s + (g.valor || 0), 0);
  const reproductoresActivos = reproductores.filter(r => r.estado === "activo");
  const totalDosis = colectas.reduce((s, c) => s + (c.numero_dosis || 0), 0);
  const inconformidadesAbiertas = inconformidades.filter(i => i.estado === "abierta");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equinos 🐴"
        subtitle={`${yeguas.length} yeguas · ${preñadas.length} preñadas`}
        actionLabel="Nueva Yegua"
        onAction={() => window.location.href = "/caballos/yeguas/nueva"}
      />

      {/* KPIs yeguas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total yeguas", value: yeguas.length, sub: "Activas en reproducción", accent: false },
          { label: "Preñadas", value: preñadas.length, sub: `${inseminadas.length} inseminadas`, accent: preñadas.length > 0 },
          { label: "Paridas", value: paridas.length, sub: "Con potro al lado", accent: false },
          { label: "Partos próximos", value: partosProx.length, sub: "Próximos 30 días", accent: partosProx.length > 0 },
        ].map((s, i) => (
          <Card key={i} className={`p-4 ${s.accent ? "border-amber-400 border-2" : ""}`}>
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className="text-2xl font-heading font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* KPIs reproductores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Reproductores activos", value: reproductoresActivos.length, sub: `${reproductores.length} total` },
          { label: "Colectas realizadas", value: colectas.length, sub: `${totalDosis} dosis totales` },
          { label: "Despachos activos", value: despachosActivos.length, sub: "En tránsito" },
          { label: "Inconformidades abiertas", value: inconformidadesAbiertas.length, sub: "Pendientes de resolver", danger: inconformidadesAbiertas.length > 0 },
        ].map((s, i) => (
          <Card key={i} className={`p-4 ${s.danger ? "border-red-200" : ""}`}>
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className={`text-2xl font-heading font-bold ${s.danger ? "text-red-600" : ""}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Terminología */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2 text-sm">📋 Terminología equina</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-blue-800">
          <div><span className="font-semibold">Hembra:</span> Yegua / Receptora</div>
          <div><span className="font-semibold">Macho:</span> Reproductor / Padrillo</div>
          <div><span className="font-semibold">Cría:</span> Potro / Potranca</div>
          <div><span className="font-semibold">Gestación:</span> 340 días</div>
        </div>
      </Card>

      {/* Líneas productivas */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Líneas productivas</h2>
        <div className="grid grid-cols-1 gap-4">
          {[
            { label: "Yeguas Reproductivas", desc: "Inseminación, preñez, confirmación, partos y destetes de yeguas", color: "border-amber-500", iconBg: "bg-amber-500", link: "/caballos/yeguas" },
            { label: "Transferencia de Embriones", desc: "Donadoras genéticas, receptoras, embriones, potros nacidos por TE", color: "border-amber-700", iconBg: "bg-amber-700", link: "/caballos/yeguas" },
            { label: "Reproductores / Semen Fresco", desc: "Padrillos, colectas de semen, despachos a clientes y seguimiento de inconformidades", color: "border-gray-800", iconBg: "bg-gray-800", link: "/reproductores" },
          ].map(l => (
            <Link to={l.link} key={l.label}>
              <Card className={`p-5 border-l-4 ${l.color} hover:shadow-lg transition-all cursor-pointer group`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${l.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <HorseIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base">{l.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{l.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: "/reproductores", Icon: Star, label: "Reproductores" },
            { to: "/reproductores/nuevo", Icon: Plus, label: "Nuevo Reproductor" },
            { to: "/caballos/yeguas", Icon: HorseIcon, label: "Yeguas" },
            { to: "/caballos/inseminacion/nueva", Icon: Baby, label: "Inseminar" },
            { to: "/despachos", Icon: Truck, label: "Despachos" },
            { to: "/clientes", Icon: Users, label: "Clientes" },
            { to: "/caballos/calendario", Icon: Calendar, label: "Calendario" },
          ].map((a, i) => (
            <Link to={a.to} key={i}>
              <Card className="p-4 hover:shadow-md transition-all cursor-pointer group text-center">
                <a.Icon className="w-8 h-8 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold">{a.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}