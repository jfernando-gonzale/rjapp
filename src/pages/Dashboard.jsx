import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { 
  Bug as Cow, Weight, Syringe, DollarSign, ShoppingCart, 
  BarChart3, Fence, Layers, Calendar, TrendingUp, 
  AlertTriangle, Clock
} from "lucide-react";
import { Card } from "@/components/ui/card";
import StatCard from "@/components/shared/StatCard";
import { formatCurrency, formatWeight, formatNumber, daysBetween } from "@/lib/helpers";

const quickActions = [
  { path: "/animales", label: "Animales", icon: Cow, color: "bg-emerald-500" },
  { path: "/pesajes/nuevo", label: "Nuevo Pesaje", icon: Weight, color: "bg-blue-500" },
  { path: "/tratamientos", label: "Tratamientos", icon: Syringe, color: "bg-purple-500" },
  { path: "/gastos/nuevo", label: "Nuevo Gasto", icon: DollarSign, color: "bg-amber-500" },
  { path: "/ventas", label: "Ventas", icon: ShoppingCart, color: "bg-rose-500" },
  { path: "/reportes", label: "Reportes", icon: BarChart3, color: "bg-indigo-500" },
  { path: "/fincas", label: "Fincas y Lotes", icon: Fence, color: "bg-teal-500" },
  { path: "/configuracion", label: "Configuración", icon: Calendar, color: "bg-gray-500" },
];

export default function Dashboard() {
  const { data: animals = [] } = useQuery({
    queryKey: ["animals"],
    queryFn: () => base44.entities.Animal.list(),
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

  const activeAnimals = animals.filter(a => a.estado === "activo");
  const soldAnimals = animals.filter(a => a.estado === "vendido");

  // Average weight
  const animalsWithWeight = activeAnimals.filter(a => a.ultimo_peso);
  const avgWeight = animalsWithWeight.length > 0
    ? animalsWithWeight.reduce((sum, a) => sum + a.ultimo_peso, 0) / animalsWithWeight.length
    : 0;

  // Total invested (purchases)
  const totalInvested = animals.reduce((sum, a) => sum + (a.precio_compra || 0), 0);

  // Total expenses
  const totalGastos = gastos.reduce((sum, g) => sum + (g.valor || 0), 0);

  // Total sales
  const totalVentas = ventas.reduce((sum, v) => sum + (v.precio_total || 0), 0);

  // Net profit
  const utilidadNeta = totalVentas - totalInvested - totalGastos;

  // Upcoming treatments
  const today = new Date().toISOString().split("T")[0];
  const upcomingTreatments = tratamientos.filter(t => t.proxima_fecha && t.proxima_fecha >= today).length;

  // Animals not weighed recently (>30 days)
  const notWeighedRecently = activeAnimals.filter(a => {
    if (!a.fecha_ultimo_pesaje) return true;
    return daysBetween(a.fecha_ultimo_pesaje, new Date()) > 30;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">
          Libreta Ganadera
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen general de tu ganadería
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link key={action.path} to={action.path}>
            <Card className="p-4 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98]">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Animales activos"
          value={activeAnimals.length}
          subtitle={`${soldAnimals.length} vendidos`}
          icon={Cow}
          color="primary"
        />
        <StatCard
          title="Peso promedio"
          value={formatWeight(avgWeight)}
          subtitle={`${animalsWithWeight.length} con pesaje`}
          icon={Weight}
          color="blue"
        />
        <StatCard
          title="Total invertido"
          value={formatCurrency(totalInvested + totalGastos)}
          subtitle="Compras + gastos"
          icon={DollarSign}
          color="accent"
        />
        <StatCard
          title="Total vendido"
          value={formatCurrency(totalVentas)}
          subtitle={utilidadNeta >= 0 ? `Utilidad: ${formatCurrency(utilidadNeta)}` : `Pérdida: ${formatCurrency(utilidadNeta)}`}
          icon={ShoppingCart}
          color={utilidadNeta >= 0 ? "success" : "danger"}
        />
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {upcomingTreatments > 0 && (
          <Card className="p-4 border-l-4 border-l-amber-400">
            <div className="flex items-center gap-3">
              <Syringe className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium">{upcomingTreatments} tratamiento{upcomingTreatments > 1 ? 's' : ''} próximo{upcomingTreatments > 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground">Revisa el calendario</p>
              </div>
            </div>
          </Card>
        )}
        {notWeighedRecently > 0 && (
          <Card className="p-4 border-l-4 border-l-red-400">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">{notWeighedRecently} animal{notWeighedRecently > 1 ? 'es' : ''} sin pesar</p>
                <p className="text-xs text-muted-foreground">Llevan más de 30 días</p>
              </div>
            </div>
          </Card>
        )}
        {activeAnimals.length === 0 && animals.length === 0 && (
          <Card className="p-4 border-l-4 border-l-blue-400 col-span-full">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">¡Empieza registrando tus animales!</p>
                <p className="text-xs text-muted-foreground">
                  Primero crea una finca, luego agrega tus animales
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}