import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { Scale, Syringe, ShoppingCart, DollarSign, Baby, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SheepIcon } from "@/components/shared/SpeciesIcons";
import PageHeader from "@/components/shared/PageHeader";
import ClickableStat from "@/components/shared/ClickableStat";
import AnimalListPanel from "@/components/shared/AnimalListPanel";
import InversionDetailPanel from "@/components/shared/InversionDetailPanel";
import { formatCurrency, inversionAnimal } from "@/lib/helpers";

export default function Ovinos() {
  const navigate = useNavigate();
  const [panel, setPanel] = useState({ open: false, title: "", description: "", animals: [] });
  const [inversionOpen, setInversionOpen] = useState(false);
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
  const corderos = activos.filter(a => a.mother_id || a.fecha_nacimiento);
  const totalInv = animals.reduce((s, a) => s + inversionAnimal(a), 0);
  const totalGastos = gastos.filter(g => g.especie === "ovino").reduce((s, g) => s + (g.valor || 0), 0);
  const totalVentas = ventas.filter(v => v.especie === "ovino").reduce((s, v) => s + (v.precio_total || 0), 0);

  const openPanel = (title, description, list) => setPanel({ open: true, title, description, animals: list });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ovinos 🐑"
        subtitle={`${activos.length} activos · ${vendidos.length} vendidos`}
        actionLabel="Nuevo Ovino"
        onAction={() => navigate("/animales/nuevo?especie=ovino")}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ClickableStat label="Total ovinos" value={animals.length} sub={`${activos.length} activos`} onClick={() => openPanel("Total ovinos", "Todos los ovinos registrados", animals)} />
        <ClickableStat label="Ovinos activos" value={activos.length} sub="En producción" onClick={() => openPanel("Ovinos activos", "Animales con estado activo", activos)} />
        <ClickableStat label="Ovejas / Borregas" value={ovejas.length} sub="Hembras reproductoras" onClick={() => openPanel("Ovejas / Borregas", "Hembras activas", ovejas)} />
        <ClickableStat label="Carneros" value={carneros.length} sub="Machos reproductores" onClick={() => openPanel("Carneros", "Machos activos", carneros)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ClickableStat label="Corderos / Corderas" value={corderos.length} sub="Crías / jóvenes" onClick={() => openPanel("Corderos / Corderas", "Crías con madre registrada", corderos)} />
        <ClickableStat label="Vendidos" value={vendidos.length} sub="Histórico de ventas" onClick={() => openPanel("Ovinos vendidos", "Animales vendidos", vendidos)} />
        <ClickableStat label="Crías vinculadas" value={animals.filter(a => a.mother_id).length} sub="Con madre asignada" onClick={() => openPanel("Crías con genealogía", "Animales con madre registrada", animals.filter(a => a.mother_id))} />
        <ClickableStat label="Sin madre asignada" value={animals.filter(a => !a.mother_id && a.estado === "activo").length} sub="Revisar genealogía" onClick={() => openPanel("Ovinos sin madre asignada", "Animales activos sin madre registrada", animals.filter(a => !a.mother_id && a.estado === "activo"))} />
      </div>

      {/* Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ClickableStat label="Inversión total" value={formatCurrency(totalInv)} sub="Compra de ovinos + costos iniciales" large onClick={() => setInversionOpen(true)} />
        <ClickableStat label="Gastos ovinos" value={formatCurrency(totalGastos)} sub="Operación ovina" large onClick={() => navigate("/gastos")} />
        <ClickableStat label="Ventas ovinas" value={formatCurrency(totalVentas)} sub={`Utilidad: ${formatCurrency(totalVentas - totalInv - totalGastos)}`} large onClick={() => navigate("/ventas?especie=ovino")} />
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
        title="Inversión total · Ovinos"
        description="Detalle financiero de compra de animales y costos iniciales asociados"
        animals={animals}
      />
    </div>
  );
}