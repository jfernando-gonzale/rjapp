import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Scale, Syringe, ShoppingCart, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";

const HorseIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 20V14c0-4 3-7 7-7s7 3 7 7v2"/>
    <path d="M15 7V4l3-1-1 4"/>
    <path d="M9 14h6"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/>
    <path d="M8 20v-3"/><path d="M16 20v-3"/>
  </svg>
);

const lineas = [
  {
    key: "yeguas",
    label: "Yeguas Reproductivas",
    desc: "Inseminación, preñez, partos y destetes de yeguas",
    color: "border-amber-500",
    iconBg: "bg-amber-500",
    link: "/caballos/yeguas",
  },
  {
    key: "receptoras",
    label: "Transferencia de Embriones",
    desc: "Receptoras, embriones, donadoras y potros nacidos",
    color: "border-amber-700",
    iconBg: "bg-amber-700",
    link: "/caballos/yeguas",
  },
  {
    key: "reproductores",
    label: "Reproductores / Semen Fresco",
    desc: "Padrillos, colectas, despachos y clientes",
    color: "border-gray-800",
    iconBg: "bg-gray-800",
    link: "/despachos",
  },
];

export default function Equinos() {
  const { data: yeguas = [] } = useQuery({
    queryKey: ["yeguas"],
    queryFn: () => base44.entities.Yegua.list(),
  });

  const preñadas = yeguas.filter(y => y.estado_reproductivo === "preñada");
  const paridas = yeguas.filter(y => y.estado_reproductivo === "parida");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equinos"
        subtitle="Gestión de caballos — reproducción, embriones y semen fresco"
        actionLabel="Nueva Yegua"
        onAction={() => window.location.href = "/caballos/yeguas/nueva"}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total yeguas", value: yeguas.length },
          { label: "Preñadas", value: preñadas.length },
          { label: "Paridas", value: paridas.length },
          { label: "Vacías", value: yeguas.filter(y => y.estado_reproductivo === "vacia").length },
        ].map((s, i) => (
          <Card key={i} className={`p-4 ${s.label === "Preñadas" && preñadas.length > 0 ? "border-amber-400 border-2" : ""}`}>
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className="text-2xl font-heading font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Líneas productivas</h2>
        <div className="grid grid-cols-1 gap-4">
          {lineas.map(l => (
            <Link to={l.link} key={l.key}>
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

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: "/caballos/yeguas", Icon: HorseIcon, label: "Yeguas" },
            { to: "/caballos/inseminacion/nueva", Icon: Scale, label: "Inseminar" },
            { to: "/caballos/parto/nuevo", Icon: Syringe, label: "Registrar Parto" },
            { to: "/despachos", Icon: Truck, label: "Despachos Semen" },
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