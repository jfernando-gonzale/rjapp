import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Scale, Syringe, DollarSign, ShoppingCart, BarChart3, Bell, TrendingUp, Baby, Truck, Users, Layers, MapPin, Sparkles, AlertTriangle, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/helpers";
import { buildProductiveAlerts, getThresholds } from "@/lib/gananciaUtils";
import RJLogo from "@/components/RJLogo";

// Iconos mejorados
const CowIcon = (props) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <ellipse cx="16" cy="18" rx="10" ry="8"/>
    <circle cx="11" cy="16" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="21" cy="16" r="1.2" fill="currentColor" stroke="none"/>
    <path d="M13 22 Q16 24 19 22"/>
    <path d="M6 18 L3 16 L4 21 L6 20"/>
    <path d="M26 18 L29 16 L28 21 L26 20"/>
    <path d="M11 10 L9 6 L7 7 L9 11"/>
    <path d="M21 10 L23 6 L25 7 L23 11"/>
    <path d="M10 26 L10 30"/><path d="M14 26 L14 30"/>
    <path d="M18 26 L18 30"/><path d="M22 26 L22 30"/>
  </svg>
);

const SheepIcon = (props) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="16" cy="13" r="9" strokeWidth="2.5"/>
    <circle cx="7" cy="10" r="3"/>
    <circle cx="25" cy="10" r="3"/>
    <circle cx="11" cy="8" r="2.5"/>
    <circle cx="21" cy="8" r="2.5"/>
    <circle cx="16" cy="6" r="2.5"/>
    <ellipse cx="16" cy="20" rx="5" ry="3.5"/>
    <circle cx="13" cy="17" r="1" fill="currentColor" stroke="none"/>
    <circle cx="19" cy="17" r="1" fill="currentColor" stroke="none"/>
    <path d="M11 23 L11 28"/><path d="M15 24 L15 28"/>
    <path d="M17 24 L17 28"/><path d="M21 23 L21 28"/>
  </svg>
);

const HorseIcon = (props) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8 Q10 8 8 14 L8 24"/>
    <path d="M16 8 Q22 8 24 14 L24 24"/>
    <path d="M8 14 Q16 17 24 14"/>
    <circle cx="11" cy="12" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="21" cy="12" r="1.2" fill="currentColor" stroke="none"/>
    <path d="M16 8 L16 4"/>
    <path d="M16 4 Q20 2 22 4 L20 8"/>
    <path d="M13 22 Q16 24 19 22"/>
    <path d="M8 24 L8 28"/><path d="M11 24 L11 28"/>
    <path d="M21 24 L21 28"/><path d="M24 24 L24 28"/>
  </svg>
);

const FarmIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <path d="M9 22V12h6v10"/>
  </svg>
);

const SPECIES = [
  { key: "todos", label: "Todas las especies" },
  { key: "bovino", label: "Bovinos" },
  { key: "ovino", label: "Ovinos" },
  { key: "equino", label: "Equinos" },
];

export default function Dashboard() {
  const [specieFilter, setSpecieFilter] = useState("todos");

  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });
  const { data: yeguas = [] } = useQuery({ queryKey: ["yeguas"], queryFn: () => base44.entities.Yegua.list() });
  const { data: gastos = [] } = useQuery({ queryKey: ["gastos"], queryFn: () => base44.entities.Gasto.list() });
  const { data: ventas = [] } = useQuery({ queryKey: ["ventas"], queryFn: () => base44.entities.Venta.list() });
  const { data: tratamientos = [] } = useQuery({ queryKey: ["tratamientos"], queryFn: () => base44.entities.Tratamiento.list() });
  const { data: pesajes = [] } = useQuery({ queryKey: ["pesajes"], queryFn: () => base44.entities.Pesaje.list() });
  const { data: eventos = [] } = useQuery({ queryKey: ["eventosCalendario"], queryFn: () => base44.entities.EventoCalendario.list() });
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });

  const today = new Date().toISOString().split("T")[0];
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);
  const in30Str = in30.toISOString().split("T")[0];

  const stats = useMemo(() => {
    if (specieFilter === "todos") {
      const bovinos = animals.filter(a => a.especie === "bovino" || !a.especie);
      const ovinos = animals.filter(a => a.especie === "ovino");
      const equinos = animals.filter(a => a.especie === "equino");
      const activos = animals.filter(a => a.estado === "activo");
      const vendidos = animals.filter(a => a.estado === "vendido");
      const totalGastos = gastos.reduce((s, g) => s + (g.valor || 0), 0);
      const totalVentas = ventas.reduce((s, v) => s + (v.precio_total || 0), 0);
      const totalInv = animals.reduce((s, a) => s + (a.precio_compra || 0), 0);
      return [
        { label: "Bovinos activos", value: bovinos.filter(a => a.estado === "activo").length, sub: `${bovinos.length} total`, Icon: CowIcon, accent: false },
        { label: "Ovinos activos", value: ovinos.filter(a => a.estado === "activo").length, sub: `${ovinos.length} total`, Icon: SheepIcon, accent: false },
        { label: "Equinos activos", value: equinos.filter(a => a.estado === "activo").length, sub: `${equinos.length} total`, Icon: HorseIcon, accent: false },
        { label: "Total activos", value: activos.length, sub: `${vendidos.length} vendidos`, Icon: null, accent: false },
        { label: "Total gastos", value: formatCurrency(totalGastos), sub: "Todos los gastos", Icon: null, accent: false, large: true },
        { label: "Total ventas", value: formatCurrency(totalVentas), sub: `Utilidad: ${formatCurrency(totalVentas - totalInv - totalGastos)}`, Icon: null, accent: (totalVentas - totalInv - totalGastos) >= 0, large: true },
      ];
    }

    if (specieFilter === "bovino") {
      const bov = animals.filter(a => a.especie === "bovino" || !a.especie);
      const activos = bov.filter(a => a.estado === "activo");
      const hembras = activos.filter(a => a.sexo === "hembra");
      const gBov = gastos.filter(g => g.especie === "bovino" || g.especie === "general" || !g.especie);
      const vBov = ventas.filter(v => v.especie === "bovino" || !v.especie);
      const pesos = activos.filter(a => a.ultimo_peso).map(a => a.ultimo_peso);
      const pesoPromedio = pesos.length ? Math.round(pesos.reduce((s, p) => s + p, 0) / pesos.length) : 0;
      const totalGBov = gBov.reduce((s, g) => s + (g.valor || 0), 0);
      const totalVBov = vBov.reduce((s, v) => s + (v.precio_total || 0), 0);
      const totalInvBov = bov.reduce((s, a) => s + (a.precio_compra || 0), 0);
      return [
        { label: "Bovinos activos", value: activos.length, sub: `${bov.filter(a => a.estado === "vendido").length} vendidos`, Icon: CowIcon, accent: false },
        { label: "Hembras reproductivas", value: hembras.length, sub: "Total hembras", Icon: null, accent: false },
        { label: "Peso promedio", value: pesoPromedio > 0 ? `${pesoPromedio} kg` : "—", sub: "Animales activos", Icon: null, accent: false },
        { label: "Gastos bovinos", value: formatCurrency(totalGBov), sub: "Total gastos", Icon: null, accent: false, large: true },
        { label: "Ventas bovinas", value: formatCurrency(totalVBov), sub: `Utilidad: ${formatCurrency(totalVBov - totalInvBov - totalGBov)}`, Icon: null, accent: (totalVBov - totalInvBov - totalGBov) >= 0, large: true },
      ];
    }

    if (specieFilter === "ovino") {
      const ovi = animals.filter(a => a.especie === "ovino");
      const activos = ovi.filter(a => a.estado === "activo");
      const hembras = activos.filter(a => a.sexo === "hembra");
      const machos = activos.filter(a => a.sexo === "macho");
      const gOvi = gastos.filter(g => g.especie === "ovino");
      const vOvi = ventas.filter(v => v.especie === "ovino");
      const totalGOvi = gOvi.reduce((s, g) => s + (g.valor || 0), 0);
      const totalVOvi = vOvi.reduce((s, v) => s + (v.precio_total || 0), 0);
      const totalInvOvi = ovi.reduce((s, a) => s + (a.precio_compra || 0), 0);
      return [
        { label: "Ovinos activos", value: activos.length, sub: `${ovi.filter(a => a.estado === "vendido").length} vendidos`, Icon: SheepIcon, accent: false },
        { label: "Ovejas (hembras)", value: hembras.length, sub: "Reproductoras", Icon: null, accent: false },
        { label: "Carneros (machos)", value: machos.length, sub: "Reproductores", Icon: null, accent: false },
        { label: "Gastos ovinos", value: formatCurrency(totalGOvi), sub: "Total gastos", Icon: null, accent: false, large: true },
        { label: "Ventas ovinas", value: formatCurrency(totalVOvi), sub: `Utilidad: ${formatCurrency(totalVOvi - totalInvOvi - totalGOvi)}`, Icon: null, accent: (totalVOvi - totalInvOvi - totalGOvi) >= 0, large: true },
      ];
    }

    if (specieFilter === "equino") {
      const equ = animals.filter(a => a.especie === "equino");
      const activos = equ.filter(a => a.estado === "activo");
      const yeguasActivas = yeguas.filter(y => y.estado_reproductivo !== "retirada");
      const preñadas = yeguas.filter(y => y.estado_reproductivo === "preñada");
      const partosProx = yeguas.filter(y => y.fecha_probable_parto && y.fecha_probable_parto >= today && y.fecha_probable_parto <= in30Str);
      const gEqu = gastos.filter(g => g.especie === "equino");
      const vEqu = ventas.filter(v => v.especie === "equino" || v.especie === "semen_equino");
      const totalGEqu = gEqu.reduce((s, g) => s + (g.valor || 0), 0);
      const totalVEqu = vEqu.reduce((s, v) => s + (v.precio_total || 0), 0);
      return [
        { label: "Equinos activos", value: activos.length, sub: `${equ.length} total`, Icon: HorseIcon, accent: false },
        { label: "Yeguas activas", value: yeguasActivas.length, sub: `${preñadas.length} preñadas`, Icon: null, accent: preñadas.length > 0 },
        { label: "Partos próximos", value: partosProx.length, sub: "Próximos 30 días", Icon: null, accent: partosProx.length > 0 },
        { label: "Gastos equinos", value: formatCurrency(totalGEqu), sub: "Total gastos", Icon: null, accent: false, large: true },
        { label: "Ventas equinas", value: formatCurrency(totalVEqu), sub: "Animales + semen", Icon: null, accent: false, large: true },
      ];
    }

    return [];
  }, [specieFilter, animals, yeguas, gastos, ventas, today, in30Str]);

  const thresholds = useMemo(() => getThresholds(user), [user]);
  const productiveAlerts = useMemo(() => buildProductiveAlerts(animals, pesajes, tratamientos, eventos, thresholds), [animals, pesajes, tratamientos, eventos, thresholds]);
  const lowGainAlerts = productiveAlerts.filter(a => a.type === "low_gain");
  const noPesajeAlerts = productiveAlerts.filter(a => a.type === "no_pesaje" || a.type === "no_pesaje_reciente");
  const readyForSale = productiveAlerts.filter(a => a.type === "ready_sale");
  const overdueTreatments = tratamientos.filter(t => t.proxima_fecha && t.proxima_fecha < today).length;
  const upcomingTreatments = tratamientos.filter(t => t.proxima_fecha && t.proxima_fecha >= today && t.proxima_fecha <= in30Str).length;
  const partosProximos = yeguas.filter(y => y.fecha_probable_parto && y.fecha_probable_parto >= today && y.fecha_probable_parto <= in30Str).length;

  const quickActions = useMemo(() => {
    if (specieFilter === "bovino") return [
      { path: "/asistente", label: "Asistente IA", Icon: Sparkles, bg: "bg-amber-500", text: "text-black" },
      { path: "/bovinos", label: "Bovinos", Icon: CowIcon, bg: "bg-amber-600", text: "text-white" },
      { path: "/pesajes", label: "Pesajes", Icon: Scale, bg: "bg-gray-700", text: "text-white" },
      { path: "/tratamientos", label: "Tratamientos", Icon: Syringe, bg: "bg-gray-600", text: "text-white" },
      { path: "/reproduccion", label: "Reproducción", Icon: Baby, bg: "bg-amber-600", text: "text-white" },
      { path: "/gastos", label: "Gastos", Icon: DollarSign, bg: "bg-gray-800", text: "text-white" },
      { path: "/ventas", label: "Ventas", Icon: ShoppingCart, bg: "bg-gray-700", text: "text-white" },
    ];
    if (specieFilter === "ovino") return [
      { path: "/asistente", label: "Asistente IA", Icon: Sparkles, bg: "bg-amber-500", text: "text-black" },
      { path: "/ovinos", label: "Ovinos", Icon: SheepIcon, bg: "bg-amber-600", text: "text-white" },
      { path: "/pesajes", label: "Pesajes", Icon: Scale, bg: "bg-gray-700", text: "text-white" },
      { path: "/tratamientos", label: "Tratamientos", Icon: Syringe, bg: "bg-gray-600", text: "text-white" },
      { path: "/reproduccion", label: "Reproducción", Icon: Baby, bg: "bg-amber-600", text: "text-white" },
      { path: "/gastos", label: "Gastos", Icon: DollarSign, bg: "bg-gray-800", text: "text-white" },
      { path: "/lotes", label: "Potreros", Icon: MapPin, bg: "bg-gray-700", text: "text-white" },
    ];
    if (specieFilter === "equino") return [
      { path: "/asistente", label: "Asistente IA", Icon: Sparkles, bg: "bg-amber-500", text: "text-black" },
      { path: "/equinos", label: "Equinos", Icon: HorseIcon, bg: "bg-amber-600", text: "text-white" },
      { path: "/caballos/yeguas", label: "Yeguas", Icon: HorseIcon, bg: "bg-gray-800", text: "text-white" },
      { path: "/reproduccion", label: "Reproducción", Icon: Baby, bg: "bg-amber-600", text: "text-white" },
      { path: "/clientes", label: "Clientes", Icon: Users, bg: "bg-gray-700", text: "text-white" },
      { path: "/despachos", label: "Despachos", Icon: Truck, bg: "bg-gray-600", text: "text-white" },
      { path: "/caballos/calendario", label: "Calendario", Icon: BarChart3, bg: "bg-amber-500", text: "text-black" },
    ];
    return [
      { path: "/asistente", label: "Asistente IA", Icon: Sparkles, bg: "bg-amber-500", text: "text-black" },
      { path: "/bovinos", label: "Bovinos", Icon: CowIcon, bg: "bg-amber-500", text: "text-black" },
      { path: "/ovinos", label: "Ovinos", Icon: SheepIcon, bg: "bg-amber-600", text: "text-white" },
      { path: "/equinos", label: "Equinos", Icon: HorseIcon, bg: "bg-amber-700", text: "text-white" },
      { path: "/fincas", label: "Fincas", Icon: FarmIcon, bg: "bg-gray-800", text: "text-white" },
      { path: "/lotes", label: "Lotes", Icon: Layers, bg: "bg-gray-700", text: "text-white" },
      { path: "/pesajes", label: "Pesajes", Icon: Scale, bg: "bg-gray-600", text: "text-white" },
      { path: "/tratamientos", label: "Tratamientos", Icon: Syringe, bg: "bg-gray-500", text: "text-white" },
      { path: "/ventas", label: "Ventas", Icon: ShoppingCart, bg: "bg-gray-800", text: "text-white" },
      { path: "/clientes", label: "Clientes", Icon: Users, bg: "bg-gray-700", text: "text-white" },
      { path: "/reportes", label: "Reportes", Icon: BarChart3, bg: "bg-amber-500", text: "text-black" },
      { path: "/calendario", label: "Alertas", Icon: Bell, bg: "bg-gray-800", text: "text-white" },
    ];
  }, [specieFilter]);

  const specieTitle = {
    todos: "Resumen general de la operación agropecuaria",
    bovino: "Resumen de operación bovina",
    ovino: "Resumen de operación ovina",
    equino: "Resumen de operación equina",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <RJLogo size="md" variant="default" />
          </div>
          <p className="text-sm text-muted-foreground">{specieTitle[specieFilter]}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SPECIES.map(b => (
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <Card key={i} className={`p-4 ${s.accent ? "border-amber-400 border-2" : ""}`}>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <div className="flex items-center gap-2">
                {s.Icon && <s.Icon className="w-5 h-5 text-amber-500" />}
                <p className={`font-heading font-bold text-foreground ${s.large ? "text-lg" : "text-2xl"}`}>{s.value}</p>
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
            <Link key={action.path + action.label} to={action.path}>
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
          {partosProximos > 0 && (specieFilter === "todos" || specieFilter === "equino") && (
            <Link to="/equinos">
              <Card className="p-4 border-l-4 border-l-amber-600 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Baby className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{partosProximos} parto{partosProximos > 1 ? 's' : ''} equino{partosProximos > 1 ? 's' : ''} próximo{partosProximos > 1 ? 's' : ''}</p>
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
                  <p className="text-xs text-muted-foreground">Empieza registrando tus fincas y animales para ver el resumen aquí</p>
                </div>
              </div>
            </Card>
          )}
          {lowGainAlerts.length > 0 && (
            <Link to="/reportes">
              <Card className="p-4 border-l-4 border-l-red-500 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{lowGainAlerts.length} animal{lowGainAlerts.length > 1 ? 'es' : ''} con baja ganancia</p>
                    <p className="text-xs text-muted-foreground">{lowGainAlerts.slice(0, 2).map(a => a.numero).join(', ')}{lowGainAlerts.length > 2 ? '...' : ''}</p>
                  </div>
                </div>
              </Card>
            </Link>
          )}
          {noPesajeAlerts.length > 0 && (
            <Link to="/pesajes">
              <Card className="p-4 border-l-4 border-l-amber-500 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{noPesajeAlerts.length} sin pesaje reciente</p>
                    <p className="text-xs text-muted-foreground">Más de 30 días</p>
                  </div>
                </div>
              </Card>
            </Link>
          )}
          {readyForSale.length > 0 && specieFilter !== "equino" && (
            <Link to="/ventas">
              <Card className="p-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{readyForSale.length} listo{readyForSale.length > 1 ? 's' : ''} para venta</p>
                    <p className="text-xs text-muted-foreground">Peso objetivo alcanzado</p>
                  </div>
                </div>
              </Card>
            </Link>
          )}
          {overdueTreatments > 0 && (
            <Link to="/calendario">
              <Card className="p-4 border-l-4 border-l-red-600 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                    <Syringe className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{overdueTreatments} tratamiento{overdueTreatments > 1 ? 's' : ''} vencido{overdueTreatments > 1 ? 's' : ''}</p>
                    <p className="text-xs text-muted-foreground">Requiere atención</p>
                  </div>
                </div>
              </Card>
            </Link>
          )}
          {upcomingTreatments === 0 && partosProximos === 0 && lowGainAlerts.length === 0 && noPesajeAlerts.length === 0 && overdueTreatments === 0 && animals.length > 0 && (
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