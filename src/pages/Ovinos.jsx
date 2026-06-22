import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Scale, Syringe, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";

const SheepIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 4c-3 0-6 2-6 5s3 5 6 5 6-2 6-5-3-5-6-5z"/>
    <path d="M8 14v4"/><path d="M16 14v4"/>
    <circle cx="10" cy="9" r="1"/><circle cx="14" cy="9" r="1"/>
    <path d="M6 7c-1.5-.5-3 .5-3 2s1.5 2.5 3 2"/><path d="M18 7c1.5-.5 3 .5 3 2s-1.5 2.5 3 2"/>
  </svg>
);

const lineas = [
  {
    key: "ceba",
    label: "Ceba / Carne",
    desc: "Ovinos para producción de carne, pesajes y ventas",
    color: "border-amber-500",
    iconBg: "bg-amber-500",
    link: "/animales?especie=ovino&linea=ceba",
  },
  {
    key: "cria",
    label: "Cría Genética / Reproductores",
    desc: "Manejo de reproductores puros, genealogías y partos",
    color: "border-gray-800",
    iconBg: "bg-gray-800",
    link: "/reproduccion?especie=ovino",
  },
];

export default function Ovinos() {
  const { data: animals = [] } = useQuery({
    queryKey: ["animals-ovinos"],
    queryFn: () => base44.entities.Animal.filter({ especie: "ovino" }),
  });

  const activos = animals.filter(a => a.estado === "activo");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ovinos"
        subtitle="Gestión de ganado ovino — ceba y cría genética"
        actionLabel="Nuevo Animal"
        onAction={() => window.location.href = "/animales/nuevo?especie=ovino"}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total ovinos", value: animals.length },
          { label: "Activos", value: activos.length },
          { label: "Vendidos", value: animals.filter(a => a.estado === "vendido").length },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className="text-2xl font-heading font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Líneas productivas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lineas.map(l => (
            <Link to={l.link} key={l.key}>
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

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: "/animales?especie=ovino", Icon: SheepIcon, label: "Ver todos" },
            { to: "/pesajes?especie=ovino", Icon: Scale, label: "Pesajes" },
            { to: "/tratamientos?especie=ovino", Icon: Syringe, label: "Tratamientos" },
            { to: "/ventas?especie=ovino", Icon: ShoppingCart, label: "Ventas" },
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