import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Scale, Syringe, DollarSign, ShoppingCart,
  BarChart3, Bell, TrendingUp, AlertTriangle,
  Clock, Users, Truck, Settings, MapPin, Layers,
  Baby, Calendar
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/helpers";
import RJLogo from "@/components/RJLogo";

const CowIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 12c0-4 2-6 4-7l1-2h6l1 2c2 1 4 3 4 7v4H4v-4z"/>
    <circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/>
    <path d="M9 16s1 1.5 3 1.5 3-1.5 3-1.5"/>
    <path d="M4 12H2l-1 3h3"/><path d="M20 12h2l1 3h-3"/>
  </svg>
);
const SheepIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 4c-3 0-6 2-6 5s3 5 6 5 6-2 6-5-3-5-6-5z"/>
    <path d="M8 14v4"/><path d="M16 14v4"/>
    <circle cx="10" cy="9" r="1"/><circle cx="14" cy="9" r="1"/>
    <path d="M6 7c-1.5-.5-3 .5-3 2s1.5 2.5-3 2"/><path d="M18 7c1.5-.5 3 .5 3 2s-1.5 2.5-3 2"/>
  </svg>
);
const HorseIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 20V14c0-4 3-7 7-7s7 3 7 7v2"/>
    <path d="M15 7V4l3-1-1 4"/>
    <path d="M9 14h6"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/>
    <path d="M8 20v-3"/><path d="M16 20v-3"/>
  </svg>
);
const FarmIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <path d="M9 22V12h6v10"/>
    <path d="M2 9h20"/>
  </svg>
);

const quickActions = [
  { path: "/bovinos", label: "Bovinos", Icon: CowIcon, bg: "bg-amber-500", text: "text-black" },
  { path: "/ovinos", label: "Ovinos", Icon: SheepIcon, bg: "bg-amber-600", text: "text-white" },
  { path: "/equinos", label: "Equinos", Icon: HorseIcon, bg: "bg-amber-700", text: "text-white" },
  { path: "/fincas", label: "Fincas", Icon: FarmIcon, bg: "bg-gray-800", text: "text-white" },
  { path: "/lotes", label: "Lotes", Icon: Layers, bg: "bg-gray-700", text: "text-white" },
  { path: "/pesajes", label: "Pesajes", Icon: Scale, bg: "bg-gray-600", text: "text-white" },
  { path: "/tratamientos", label: "Tratamientos", Icon: Syringe, bg: "bg-gray-500", text: "text-white" },
  { path: "/ventas", label: "Ventas", Icon: ShoppingCart, bg: "bg-gray-800", text: "text-white" },
  { path: "/clientes", label: "Clientes", Icon: Users, bg: "bg-gray-700", text: "text-white" },
  { path: "/despachos", label: "Despachos", Icon: Truck, bg: "bg-gray-600", text: "text-white" },
  { path: "/reportes", label: "Reportes", Icon: BarChart3, bg: "bg-amber-500", text: "text-black" },
  { path: "/calendario", label: "Alertas", Icon: Bell, bg: "bg-gray-800", text: "text-white" },
];

export default function Dashboard() {
  const [specieFilter, setSpecieFilter] = useState("todos");

  const { data: animals = [] } = useQuery({
    queryKey: ["animals"],
    queryFn: () => base44.entities.Animal.list(),
  });

  const { data: yeguas = [] } = useQuery({
    queryKey: ["yeguas"],
    queryFn: () => base44.entities.Yegua.list(),
  });

  const { data: gastos = [] } = useQuery({
    queryKey: ["gastos"],
    queryFn: () => base44.entities.Gasto.list(),
  });

  const { data: ventas = [] } = useQuery({
    queryKey: ["ventas"],
    queryFn: () => base44.entities.Venta.list(),
  });

  const { data: tratamientos = [] } = useQuery({
    queryKey: ["tratamientos"],
    queryFn: () => base44.entities.Tratamiento.list(),
  });

  const { data: partos = [] } = useQuery({
    queryKey: ["partos"],
    queryFn: () => base44.entities.Parto.list(),
  });

  // Filtrar animales por especie
  const filterAnimals = (list) => {
    if (specieFilter === "todos") return list;
    if (specieFilter === "bovinos") return list.filter(a => a.especie === "bovino" || !a.especie);
    if (specieFilter === "ovinos") return list.filter(a => a.especie === "ovino");
    if (specieFilter === "equinos") return list.filter(a => a.especie === "equino");
    return list;
  };

  const filteredAnimals = filterAnimals(animals);

  const activeAnimals = filteredAnimals.filter(a => a.estado === "activo");
  const soldAnimals = filteredAnimals.filter(a => a.estado === "vendido");

  const bovinos = animals.filter(a => a.especie === "bovino" || !a.especie);
  const ovinos = animals.filter(a => a.especie === "ovino");
  const equinos = animals.filter(a => a.especie === "equino");

  const totalInvested = filteredAnimals.reduce((sum, a) => sum + (a.precio_compra || 0), 0);
  const totalGastos = gastos.reduce((sum, g) => sum + (g.valor || 0), 0);
  const totalVentas = ventas.reduce((sum, v) => sum + (v.precio_total || 0), 0);
  const utilidad = totalVentas - totalInvested - totalGastos;

  const today = new Date().toISOString().split("T")[0];
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);
  const in30Str = in30.toISOString().split("T")[0];

  const partosProximos = yeguas.filter(y => y.fecha_probable_parto && y.fecha_probable_parto >= today && y.fecha_probable_parto <= in30Str).length;
  const yeguasPreñadas = yeguas.filter(y => y.estado_reproductivo === "preñada").length;
  const upcomingTreatments = tratamientos.filter(t => t.proxima_fecha && t.proxima_fecha >= today && t.proxima_fecha <= in30Str).length;

  const specieButtons = [
    { key: "todos", label: "Todas las especies" },
    { key: "bovinos", label: "Bovinos" },
    { key: "ovinos", label: "Ovinos" },
    { key: "equinos", label: "Equinos" },
  ];

  const stats = [
    { label: "Bovinos", value: bovinos.filter(a => a.estado === "activo").length, sub: `${bovinos.length} total`, icon: CowIcon, accent: true },
    { label: "Ovinos", value: ovinos.filter(a => a.estado === "activo").length, sub: `${ovinos.length} total`, icon: SheepIcon, accent: false },
    { label: "Equinos", value: equinos.filter(a => a.estado === "activo").length, sub: `${equinos.length} total`, icon: HorseIcon, accent: false },
    { label: "Total activos", value: activeAnimals.length, sub: `${soldAnimals.length} vendidos`, icon: null, accent: false },
    { label: "Yeguas preñadas", value: yeguasPreñadas, sub: `${partosProximos} partos en 30 días`, icon: null, accent: partosProximos > 0 },
    { label: "Partos próximos", value: partosProximos, sub: "Próximos 30 días", icon: null, accent: partosProximos > 0 },
    { label: "Total invertido", value: formatCurrency(totalInvested + totalGastos), sub: "Compras + gastos", icon: null, accent: false, large: true },
    { label: "Total vendido", value: formatCurrency(totalVentas), sub: utilidad >= 0 ? `Utilidad: ${formatCurrency(utilidad)}` : `Pérdida: ${formatCurrency(utilidad)}`, icon: null, accent: utilidad >= 0, large: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <RJLogo size="md" variant="default" />
          </div>
          <p className="text-sm text-muted-foreground">Resumen general de la operación agropecuaria</p>
        </div>
        {/* Filtro especie */}
        <div className="flex flex-wrap gap-1.5">
          {specieButtons.map(b => (
            <button
              key={b.key}
              onClick={() => setSpecieFilter(b.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                specieFilter === b.key
                  ? "bg-amber-500 text-black border-amber-500 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <Card key={i} className={`p-4 ${s.accent ? "border-amber-400 border-2" : ""}`}>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <div className="flex items-center gap-2">
                {s.icon && <s.icon className="w-5 h-5 text-amber-500" />}
                <p className={`font-heading font-bold text-foreground ${s.large ? "text-lg" : "text-2xl"}`}>
                  {s.value}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Acceso rápido</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link key={action.path} to={action.path}>
              <Card className="p-3 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.97] border-0 shadow-sm">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                    <action.Icon className={`w-6 h-6 ${action.text}`} />
                  </div>
                  <span className="text-xs font-semibold text-foreground leading-tight">{action.label}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Alertas */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Alertas y avisos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {upcomingTreatments > 0 && (
            <Link to="/calendario">
              <Card className="p-4 border-l-4 border-l-amber-500 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Syringe className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{upcomingTreatments} tratamiento{upcomingTreatments > 1 ? 's' : ''} próximo{upcomingTreatments > 1 ? 's' : ''}</p>
                    <p className="text-xs text-muted-foreground">Próximos 30 días</p>
                  </div>
                </div>
              </Card>
            </Link>
          )}
          {partosProximos > 0 && (
            <Link to="/equinos">
              <Card className="p-4 border-l-4 border-l-amber-600 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Baby className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{partosProximos} parto{partosProximos > 1 ? 's' : ''} próximo{partosProximos > 1 ? 's' : ''}</p>
                    <p className="text-xs text-muted-foreground">Próximos 30 días</p>
                  </div>
                </div>
              </Card>
            </Link>
          )}
          {animals.length === 0 && (
            <Card className="p-4 border-l-4 border-l-amber-400 col-span-full">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">¡Bienvenido a RJAPP!</p>
                  <p className="text-xs text-muted-foreground">
                    Empieza registrando tus fincas y animales para ver el resumen aquí
                  </p>
                </div>
              </div>
            </Card>
          )}
          {upcomingTreatments === 0 && partosProximos === 0 && animals.length > 0 && (
            <Card className="p-4 border-l-4 border-l-gray-300 col-span-full">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Sin alertas pendientes</p>
                  <p className="text-xs text-muted-foreground">Todo al día por ahora</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}