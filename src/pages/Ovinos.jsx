import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Scale, Syringe, ShoppingCart, DollarSign, Baby, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SheepIcon } from "@/components/shared/SpeciesIcons";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency } from "@/lib/helpers";

export default function Ovinos() {
  const { data: animals = [] } = useQuery({
    queryKey: ["animals"],
    queryFn: () => base44.entities.Animal.list(),
    select: (data) => data.filter(a => a.especie === "ovino"),
  });
  const { data: gastos = [] } = useQuery({ queryKey: ["gastos"], queryFn: () => base44.entities.Gasto.list() });
  const { data: ventas = [] } = useQuery({ queryKey: ["ventas"], queryFn: () => base44.entities.Venta.list() });

  const activos = animals.filter(a => a.estado === "activo");
  const vendidos = animals.filter(a => a.estado === "vendido");
  const ovejas = activos.filter(a => a.sexo === "hembra");
  const carneros = activos.filter(a => a.sexo === "macho");
  const totalInv = animals.reduce((s, a) => s + (a.precio_compra || 0), 0);
  const totalGastos = gastos.filter(g => g.especie === "ovino").reduce((s, g) => s + (g.valor || 0), 0);
  const totalVentas = ventas.filter(v => v.especie === "ovino").reduce((s, v) => s + (v.precio_total || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ovinos 🐑"
        subtitle={`${activos.length} activos · ${vendidos.length} vendidos`}
        actionLabel="Nuevo Ovino"
        onAction={() => window.location.href = "/animales/nuevo"}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total ovinos", value: animals.length, sub: `${activos.length} activos` },
          { label: "Ovejas / Borregas", value: ovejas.length, sub: "Hembras reproductoras" },
          { label: "Carneros", value: carneros.length, sub: "Machos reproductores" },
          { label: "Vendidos", value: vendidos.length, sub: "Total vendidos" },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className="text-2xl font-heading font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Inversión total", value: formatCurrency(totalInv), sub: "Compra de ovinos" },
          { label: "Gastos ovinos", value: formatCurrency(totalGastos), sub: "Operación ovina" },
          { label: "Ventas ovinas", value: formatCurrency(totalVentas), sub: `Utilidad: ${formatCurrency(totalVentas - totalInv - totalGastos)}` },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className="text-xl font-heading font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Terminología ovina */}
      <Card className="p-4 bg-green-50 border-green-200">
        <h3 className="font-semibold text-green-900 mb-2 text-sm">📋 Terminología ovina</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-green-800">
          <div><span className="font-semibold">Hembra:</span> Oveja / Borrega</div>
          <div><span className="font-semibold">Macho:</span> Carnero</div>
          <div><span className="font-semibold">Cría:</span> Cordero / Cordera</div>
          <div><span className="font-semibold">Gestación:</span> 150 días</div>
        </div>
      </Card>

      {/* Líneas productivas */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Líneas productivas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Ceba / Carne Ovina", desc: "Ovinos para producción de carne. Corderos, pesajes y ventas", color: "border-amber-500", iconBg: "bg-amber-500", link: "/animales?especie=ovino" },
            { label: "Cría Genética Ovina", desc: "Reproductores puros, genealogías, partos, corderos y destetes", color: "border-green-600", iconBg: "bg-green-600", link: "/reproduccion" },
          ].map(l => (
            <Link to={l.link} key={l.label}>
              <Card className={`p-5 border-l-4 ${l.color} hover:shadow-lg transition-all cursor-pointer group`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${l.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <SheepIcon className="w-6 h-6 text-white" />
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
            { to: "/animales?especie=ovino", Icon: SheepIcon, label: "Ver ovinos" },
            { to: "/pesajes", Icon: Scale, label: "Pesajes" },
            { to: "/tratamientos", Icon: Syringe, label: "Tratamientos" },
            { to: "/reproduccion", Icon: Baby, label: "Partos / crías" },
            { to: "/gastos", Icon: DollarSign, label: "Gastos" },
            { to: "/lotes", Icon: MapPin, label: "Potreros" },
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