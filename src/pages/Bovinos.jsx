import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, Scale, Syringe, ShoppingCart, BarChart3, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";

const CowIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 12c0-4 2-6 4-7l1-2h6l1 2c2 1 4 3 4 7v4H4v-4z"/>
    <circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/>
    <path d="M9 16s1 1.5 3 1.5 3-1.5 3-1.5"/>
    <path d="M4 12H2l-1 3h3"/><path d="M20 12h2l1 3h-3"/>
  </svg>
);

const lineas = [
  {
    key: "ceba",
    label: "Ceba / Engorde",
    desc: "Bovinos para producción de carne, pesajes y ventas",
    color: "border-amber-500",
    bg: "bg-amber-50",
    iconBg: "bg-amber-500",
    link: "/animales?especie=bovino&linea=ceba",
  },
  {
    key: "reproduccion",
    label: "Reproducción Bovina",
    desc: "Hembras reproductivas, inseminaciones, embriones y partos",
    color: "border-gray-800",
    bg: "bg-gray-50",
    iconBg: "bg-gray-800",
    link: "/reproduccion?especie=bovino",
  },
];

export default function Bovinos() {
  const { data: animals = [] } = useQuery({
    queryKey: ["animals-bovinos"],
    queryFn: () => base44.entities.Animal.filter({ especie: "bovino" }),
  });

  const activos = animals.filter(a => a.estado === "activo");
  const vendidos = animals.filter(a => a.estado === "vendido");
  const enCeba = animals.filter(a => a.linea_productiva === "ceba");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bovinos"
        subtitle="Gestión de ganado bovino — ceba y reproducción"
        actionLabel="Nuevo Animal"
        onAction={() => window.location.href = "/animales/nuevo?especie=bovino"}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total bovinos", value: animals.length },
          { label: "Activos", value: activos.length },
          { label: "En ceba", value: enCeba.length },
          { label: "Vendidos", value: vendidos.length },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className="text-2xl font-heading font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Líneas productivas */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Líneas productivas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lineas.map(l => (
            <Link to={l.link} key={l.key}>
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
          <Link to="/animales?especie=bovino">
            <Card className="p-4 hover:shadow-md transition-all cursor-pointer group text-center">
              <CowIcon className="w-8 h-8 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold">Ver todos</p>
            </Card>
          </Link>
          <Link to="/pesajes?especie=bovino">
            <Card className="p-4 hover:shadow-md transition-all cursor-pointer group text-center">
              <Scale className="w-8 h-8 text-gray-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold">Pesajes</p>
            </Card>
          </Link>
          <Link to="/tratamientos?especie=bovino">
            <Card className="p-4 hover:shadow-md transition-all cursor-pointer group text-center">
              <Syringe className="w-8 h-8 text-gray-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold">Tratamientos</p>
            </Card>
          </Link>
          <Link to="/ventas?especie=bovino">
            <Card className="p-4 hover:shadow-md transition-all cursor-pointer group text-center">
              <ShoppingCart className="w-8 h-8 text-gray-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold">Ventas</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}