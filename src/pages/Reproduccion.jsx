import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import { Calendar, Baby, Heart, GitBranch, ChevronRight } from "lucide-react";

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
    <circle cx="7" cy="10" r="3"/><circle cx="25" cy="10" r="3"/>
    <circle cx="11" cy="8" r="2.5"/><circle cx="21" cy="8" r="2.5"/>
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

const MODULOS = [
  {
    especie: "Bovinos",
    key: "bovino",
    icon: CowIcon,
    color: "border-amber-500",
    iconBg: "bg-amber-500",
    gestacion: "283 días",
    desc: "Inseminaciones, transferencias de embriones, preñeces y partos bovinos",
    links: [
      { to: "/animales?especie=bovino", label: "Hembras bovinas (vacas / novillas)" },
      { to: "/caballos/inseminacion/nueva?especie=bovino", label: "Registrar inseminación bovina" },
      { to: "/caballos/preñez/nueva?especie=bovino", label: "Confirmar preñez bovina" },
      { to: "/caballos/parto/nuevo?especie=bovino", label: "Registrar parto bovino" },
      { to: "/caballos/destete/nuevo?especie=bovino", label: "Registrar destete bovino" },
    ],
    terminos: [
      { label: "Hembra", desc: "Vaca / Novilla" },
      { label: "Macho", desc: "Toro" },
      { label: "Cría", desc: "Ternero / Ternera" },
      { label: "Gestación", desc: "283 días" },
    ]
  },
  {
    especie: "Ovinos",
    key: "ovino",
    icon: SheepIcon,
    color: "border-green-500",
    iconBg: "bg-green-600",
    gestacion: "150 días",
    desc: "Montas, preñeces, partos ovinos, corderos, camadas y destetes",
    links: [
      { to: "/animales?especie=ovino", label: "Ovejas reproductoras (hembras)" },
      { to: "/caballos/inseminacion/nueva?especie=ovino", label: "Registrar monta / servicio ovino" },
      { to: "/caballos/preñez/nueva?especie=ovino", label: "Confirmar preñez ovina" },
      { to: "/caballos/parto/nuevo?especie=ovino", label: "Registrar parto ovino (corderos)" },
      { to: "/caballos/crias?especie=ovino", label: "Ver corderos / crías ovinas" },
    ],
    terminos: [
      { label: "Hembra", desc: "Oveja / Borrega" },
      { label: "Macho", desc: "Carnero" },
      { label: "Cría", desc: "Cordero / Cordera" },
      { label: "Gestación", desc: "150 días" },
    ]
  },
  {
    especie: "Equinos",
    key: "equino",
    icon: HorseIcon,
    color: "border-gray-700",
    iconBg: "bg-gray-800",
    gestacion: "340 días",
    desc: "Yeguas, receptoras, donadoras, embriones y potros nacidos por transferencia",
    links: [
      { to: "/caballos/yeguas", label: "Yeguas reproductivas" },
      { to: "/caballos/inseminacion/nueva", label: "Registrar inseminación equina" },
      { to: "/caballos/preñez/nueva", label: "Confirmar preñez equina" },
      { to: "/caballos/parto/nuevo", label: "Registrar parto equino (potro)" },
      { to: "/caballos/crias", label: "Ver potros / crías equinas" },
      { to: "/caballos/calendario", label: "Calendario reproductivo equino" },
    ],
    terminos: [
      { label: "Hembra", desc: "Yegua / Receptora" },
      { label: "Macho", desc: "Reproductor / Padrillo" },
      { label: "Cría", desc: "Potro / Potranca" },
      { label: "Gestación", desc: "340 días" },
    ]
  },
];

export default function Reproduccion() {
  const [activeEspecie, setActiveEspecie] = useState(null);
  const modulos = activeEspecie ? MODULOS.filter(m => m.key === activeEspecie) : MODULOS;

  return (
    <div className="space-y-5">
      <PageHeader title="Reproducción" subtitle="Centro de gestión reproductiva por especie" />

      {/* Filtro especie */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: null, label: "Todas las especies" },
          { key: "bovino", label: "🐄 Bovinos" },
          { key: "ovino", label: "🐑 Ovinos" },
          { key: "equino", label: "🐴 Equinos" },
        ].map(e => (
          <button key={String(e.key)} onClick={() => setActiveEspecie(e.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeEspecie === e.key ? "bg-amber-500 text-black border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
            }`}>{e.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5">
        {modulos.map(m => (
          <Card key={m.especie} className={`p-5 border-l-4 ${m.color}`}>
            {/* Header especie */}
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

            {/* Terminología correcta */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {m.terminos.map(t => (
                <div key={t.label} className="bg-muted/40 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.label}</p>
                  <p className="text-xs font-semibold mt-0.5 leading-tight">{t.desc}</p>
                </div>
              ))}
            </div>

            {/* Acciones */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {m.links.map(l => (
                <Link to={l.to} key={l.to}>
                  <div className="px-3 py-2.5 rounded-lg bg-muted hover:bg-amber-50 hover:text-amber-900 transition-all text-sm font-medium cursor-pointer border border-transparent hover:border-amber-200 flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span className="leading-tight">{l.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Accesos rápidos */}
      <Card className="p-4">
        <h2 className="font-heading font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-500" /> Accesos rápidos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: "/caballos/calendario", icon: Calendar, label: "Calendario equinos" },
            { to: "/caballos/crias", icon: Baby, label: "Potros / crías" },
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