import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import { Calendar, Baby, Heart, Eye, GitBranch } from "lucide-react";

const CowIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 12c0-4 2-6 4-7l1-2h6l1 2c2 1 4 3 4 7v4H4v-4z"/>
    <circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/>
  </svg>
);
const SheepIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 4c-3 0-6 2-6 5s3 5 6 5 6-2 6-5-3-5-6-5z"/>
    <path d="M8 14v4"/><path d="M16 14v4"/>
  </svg>
);
const HorseIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 20V14c0-4 3-7 7-7s7 3 7 7v2"/>
    <path d="M15 7V4l3-1-1 4"/>
    <path d="M8 20v-3"/><path d="M16 20v-3"/>
  </svg>
);

const modulos = [
  {
    especie: "Bovinos",
    icon: CowIcon,
    color: "border-amber-500",
    iconBg: "bg-amber-500",
    links: [
      { to: "/animales?especie=bovino&estado_reproductivo=activo", label: "Hembras reproductivas" },
      { to: "/caballos/inseminacion/nueva?especie=bovino", label: "Registrar inseminación" },
      { to: "/caballos/preñez/nueva?especie=bovino", label: "Confirmar preñez" },
      { to: "/caballos/parto/nuevo?especie=bovino", label: "Registrar parto" },
      { to: "/caballos/destete/nuevo?especie=bovino", label: "Registrar destete" },
    ],
    desc: "Inseminaciones, transferencias de embriones, preñeces y partos bovinos",
    gestacion: "283 días"
  },
  {
    especie: "Ovinos",
    icon: SheepIcon,
    color: "border-amber-600",
    iconBg: "bg-amber-600",
    links: [
      { to: "/animales?especie=ovino&estado_reproductivo=activo", label: "Hembras reproductoras" },
      { to: "/caballos/inseminacion/nueva?especie=ovino", label: "Registrar monta/servicio" },
      { to: "/caballos/parto/nuevo?especie=ovino", label: "Registrar parto" },
      { to: "/caballos/crias?especie=ovino", label: "Ver crías" },
    ],
    desc: "Montas, confirmaciones de preñez, partos y cría genética ovina",
    gestacion: "150 días"
  },
  {
    especie: "Equinos",
    icon: HorseIcon,
    color: "border-gray-800",
    iconBg: "bg-gray-800",
    links: [
      { to: "/caballos/yeguas", label: "Yeguas reproductivas" },
      { to: "/caballos/inseminacion/nueva", label: "Registrar inseminación" },
      { to: "/caballos/preñez/nueva", label: "Confirmar preñez" },
      { to: "/caballos/parto/nuevo", label: "Registrar parto" },
      { to: "/caballos/crias", label: "Ver potros / crías" },
      { to: "/caballos/calendario", label: "Calendario reproductivo" },
    ],
    desc: "Yeguas, receptoras, embriones equinos y potros nacidos por transferencia",
    gestacion: "340 días"
  },
];

export default function Reproduccion() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reproducción" subtitle="Centro de gestión reproductiva por especie" />

      <div className="grid grid-cols-1 gap-5">
        {modulos.map(m => (
          <Card key={m.especie} className={`p-5 border-l-4 ${m.color}`}>
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl ${m.iconBg} flex items-center justify-center flex-shrink-0`}>
                <m.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-heading font-bold text-lg">{m.especie}</h2>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                    Gestación: {m.gestacion}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {m.links.map(l => (
                <Link to={l.to} key={l.to}>
                  <div className="px-3 py-2 rounded-lg bg-muted hover:bg-amber-50 hover:text-amber-900 transition-all text-sm font-medium cursor-pointer border border-transparent hover:border-amber-200">
                    {l.label}
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h2 className="font-heading font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-500" /> Accesos rápidos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: "/caballos/calendario", icon: Calendar, label: "Calendario equinos" },
            { to: "/caballos/crias", icon: Baby, label: "Crías / potros" },
            { to: "/caballos/inseminacion/nueva", icon: Heart, label: "Nueva inseminación" },
            { to: "/caballos/parto/nuevo", icon: GitBranch, label: "Nuevo parto" },
          ].map((a, i) => (
            <Link to={a.to} key={i}>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted hover:bg-amber-50 hover:border-amber-200 border border-transparent transition-all cursor-pointer text-center">
                <a.icon className="w-7 h-7 text-amber-500" />
                <span className="text-xs font-semibold">{a.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}