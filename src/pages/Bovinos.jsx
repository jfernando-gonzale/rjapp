import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { Scale, Syringe, ShoppingCart, DollarSign, Baby } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import ClickableStat from "@/components/shared/ClickableStat";
import AnimalListPanel from "@/components/shared/AnimalListPanel";
import InversionDetailPanel from "@/components/shared/InversionDetailPanel";
import { formatCurrency, formatWeight, inversionAnimal } from "@/lib/helpers";

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
  const navigate = useNavigate();
  const [panel, setPanel] = useState({ open: false, title: "", description: "", animals: [] });
  const [inversionOpen, setInversionOpen] = useState(false);
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
  const totalInv = animals.reduce((s, a) => s + inversionAnimal(a), 0);
  const totalGastos = gastos.filter(g => g.especie === "bovino" || g.especie === "general" || !g.especie).reduce((s, g) => s + (g.valor || 0), 0);
  const totalVentas = ventas.filter(v => v.especie === "bovino" || !v.especie).reduce((s, v) => s + (v.precio_total || 0), 0);

  const openPanel = (title, description, list) => setPanel({ open: true, title, description, animals: list });
  const terneros = activos.filter(a => a.mother_id || a.fecha_nacimiento);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bovinos 🐄"
        subtitle={`${activos.length} activos · ${vendidos.length} vendidos`}
        actionLabel="Nuevo Bovino"
        onAction={() => navigate("/animales/nuevo?especie=bovino")}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ClickableStat label="Total bovinos" value={animals.length} sub={`${activos.length} activos`} onClick={() => openPanel("Total bovinos", "Todos los bovinos registrados", animals)} />
        <ClickableStat label="Bovinos activos" value={activos.length} sub="En producción" onClick={() => openPanel("Bovinos activos", "Animales con estado activo", activos)} />
        <ClickableStat label="Vacas / Novillas" value={hembras.length} sub="Hembras reproductivas" onClick={() => openPanel("Vacas / Novillas", "Hembras activas", hembras)} />
        <ClickableStat label="Toros / Novillos" value={machos.length} sub="Machos activos" onClick={() => openPanel("Toros / Novillos", "Machos activos", machos)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ClickableStat label="Terneros / Terneras" value={terneros.length} sub="Crías / jóvenes" onClick={() => openPanel("Terneros / Terneras", "Animales con madre registrada", terneros)} />
        <ClickableStat label="Vendidos" value={vendidos.length} sub="Histórico de ventas" onClick={() => openPanel("Bovinos vendidos", "Animales vendidos", vendidos)} />
        <ClickableStat label="Peso promedio" value={pesoPromedio > 0 ? `${pesoPromedio} kg` : "—"} sub="Animales activos" onClick={() => openPanel("Bovinos con peso", "Animales activos con peso registrado", activos.filter(a => a.ultimo_peso))} />
        <ClickableStat label="Crías vinculadas" value={animals.filter(a => a.mother_id).length} sub="Con madre asignada" onClick={() => openPanel("Crías con genealogía", "Animales con madre registrada", animals.filter(a => a.mother_id))} />
      </div>

      {/* Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ClickableStat label="Inversión total" value={formatCurrency(totalInv)} sub="Compra de animales + costos iniciales" large onClick={() => setInversionOpen(true)} />
        <ClickableStat label="Gastos totales" value={formatCurrency(totalGastos)} sub="Operación bovina" large onClick={() => navigate("/gastos")} />
        <ClickableStat label="Ventas" value={formatCurrency(totalVentas)} sub={`Utilidad: ${formatCurrency(totalVentas - totalInv - totalGastos)}`} large onClick={() => navigate("/ventas?especie=bovino")} />
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

      <AnimalListPanel
        open={panel.open}
        onOpenChange={(open) => setPanel(p => ({ ...p, open }))}
        title={panel.title}
        description={panel.description}
        animals={panel.animals}
      />

      <InversionDetailPanel
        open={inversionOpen}
        onOpenChange={setInversionOpen}
        title="Inversión total · Bovinos"
        description="Detalle financiero de compra de animales y costos iniciales asociados"
        animals={animals}
      />
    </div>
  );
}