import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Scale, Syringe, ShoppingCart, DollarSign, Baby } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency, formatWeight } from "@/lib/helpers";

const CowIcon = (props) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <ellipse cx="16" cy="19" rx="10" ry="8"/>
    <circle cx="11" cy="17" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="21" cy="17" r="1.2" fill="currentColor" stroke="none"/>
    <path d="M13 23 Q16 25 19 23"/>
    <path d="M6 19 L3 17 L4 22 L6 21"/>
    <path d="M26 19 L29 17 L28 22 L26 21"/>
    <path d="M11 11 L9 7 L7 8 L9 12"/>
    <path d="M21 11 L23 7 L25 8 L23 12"/>
    <path d="M10 27 L10 31"/><path d="M14 27 L14 31"/>
    <path d="M18 27 L18 31"/><path d="M22 27 L22 31"/>
  </svg>
);

export default function Bovinos() {
  const { data: animals = [] } = useQuery({
    queryKey: ["animals"],
    queryFn: () => base44.entities.Animal.list(),
    select: (data) => data.filter(a => a.especie === "bovino" || !a.especie),
  });
  const { data: gastos = [] } = useQuery({ queryKey: ["gastos"], queryFn: () => base44.entities.Gasto.list() });
  const { data: ventas = [] } = useQuery({ queryKey: ["ventas"], queryFn: () => base44.entities.Venta.list() });

  const activos = animals.filter(a => a.estado === "activo");
  const vendidos = animals.filter(a => a.estado === "vendido");
  const hembras = activos.filter(a => a.sexo === "hembra");
  const machos = activos.filter(a => a.sexo === "macho");
  const pesos = activos.filter(a => a.ultimo_peso).map(a => a.ultimo_peso);
  const pesoPromedio = pesos.length ? Math.round(pesos.reduce((s, p) => s + p, 0) / pesos.length) : 0;
  const totalInv = animals.reduce((s, a) => s + (a.precio_compra || 0), 0);
  const totalGastos = gastos.filter(g => g.especie === "bovino" || g.especie === "general" || !g.especie).reduce((s, g) => s + (g.valor || 0), 0);
  const totalVentas = ventas.filter(v => v.especie === "bovino" || !v.especie).reduce((s, v) => s + (v.precio_total || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bovinos 🐄"
        subtitle={`${activos.length} activos · ${vendidos.length} vendidos`}
        actionLabel="Nuevo Bovino"
        onAction={() => window.location.href = "/animales/nuevo"}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total bovinos", value: animals.length, sub: `${activos.length} activos` },
          { label: "Vacas / Novillas", value: hembras.length, sub: "Hembras reproductivas" },
          { label: "Toros / Novillos", value: machos.length, sub: "Machos activos" },
          { label: "Peso promedio", value: pesoPromedio > 0 ? `${pesoPromedio} kg` : "—", sub: "Animales activos" },
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
          { label: "Inversión total", value: formatCurrency(totalInv), sub: "Compra de animales" },
          { label: "Gastos totales", value: formatCurrency(totalGastos), sub: "Operación bovina" },
          { label: "Ventas", value: formatCurrency(totalVentas), sub: `Utilidad: ${formatCurrency(totalVentas - totalInv - totalGastos)}` },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className="text-xl font-heading font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Líneas productivas */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Líneas productivas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Ceba / Engorde", desc: "Bovinos para producción de carne. Pesajes, ganancias y ventas", color: "border-amber-500", iconBg: "bg-amber-500", link: "/animales?especie=bovino" },
            { label: "Reproducción Bovina", desc: "Vacas, novillas, inseminaciones, transferencias, preñeces y partos bovinos", color: "border-gray-800", iconBg: "bg-gray-800", link: "/reproduccion?especie=bovino" },
          ].map(l => (
            <Link to={l.link} key={l.label}>
              <Card className={`p-5 border-l-4 ${l.color} hover:shadow-lg transition-all cursor-pointer group`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${l.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <CowIcon className="w-6 h-6 text-white" />
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
            { to: "/animales?especie=bovino", Icon: CowIcon, label: "Ver bovinos" },
            { to: "/pesajes", Icon: Scale, label: "Pesajes" },
            { to: "/tratamientos", Icon: Syringe, label: "Tratamientos" },
            { to: "/reproduccion", Icon: Baby, label: "Reproducción" },
            { to: "/gastos", Icon: DollarSign, label: "Gastos" },
            { to: "/ventas?especie=bovino", Icon: ShoppingCart, label: "Ventas" },
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