import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Heart, Baby, AlertCircle, Activity, TrendingUp, Users, FlaskConical, Truck, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { daysBetween, formatWeight } from "@/lib/helpers";

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    gray: "bg-gray-100 text-gray-500",
  };
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded-lg ${colorMap[color] || colorMap.gray}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <p className="text-[11px] text-muted-foreground font-medium leading-tight">{label}</p>
      </div>
      <p className="text-lg font-bold">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function NoData({ msg }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" /> {msg || "No hay datos suficientes para calcular este indicador."}
      </p>
    </Card>
  );
}

function BovinosRepro({ animals, eventos, today }) {
  const hembras = animals.filter(a => a.sexo === "hembra" && a.estado === "activo");
  const machos = animals.filter(a => a.sexo === "macho" && a.estado === "activo");
  const terneros = animals.filter(a => a.fecha_nacimiento && new Date(a.fecha_nacimiento) > new Date("2026-01-01") && a.estado === "activo");
  const ternerosMuertos = animals.filter(a => a.fecha_nacimiento && new Date(a.fecha_nacimiento) > new Date("2026-01-01") && a.estado === "muerto");

  const preñadas = hembras.filter(h => {
    return eventos.some(ev => ev.animal_id === h.id && ev.tipo_evento === "reproduccion" && ev.subtipo === "confirmacion_preñez" && ev.fecha <= today);
  });
  const partosProx = eventos.filter(ev => ev.especie === "bovino" && ev.tipo_evento === "reproduccion" && ev.subtipo === "parto" && ev.fecha >= today && ev.estado === "pendiente");
  const destetesProx = eventos.filter(ev => ev.especie === "bovino" && ev.tipo_evento === "reproduccion" && ev.subtipo === "destete" && ev.fecha >= today && ev.estado === "pendiente");

  const tasaPreñez = hembras.length > 0 ? Math.round((preñadas.length / hembras.length) * 100) : 0;
  const vacias = hembras.length - preñadas.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Hembras reproductivas" value={hembras.length} sub="Activas" color="emerald" />
        <StatCard icon={Heart} label="Hembras preñadas" value={preñadas.length} sub={`Tasa preñez: ${tasaPreñez}%`} color="purple" />
        <StatCard icon={AlertCircle} label="Hembras vacías" value={vacias} sub="Sin preñez confirmada" color="amber" />
        <StatCard icon={Activity} label="Días abiertos prom." value="—" sub="Sin datos de partos" color="gray" />
        <StatCard icon={Baby} label="Partos próximos" value={partosProx.length} sub="Próximos eventos" color="blue" />
        <StatCard icon={Baby} label="Destetes próximos" value={destetesProx.length} sub="Próximos eventos" color="amber" />
        <StatCard icon={Baby} label="Terneros nacidos" value={terneros.length} sub="Este año" color="emerald" />
        <StatCard icon={AlertTriangle} label="Terneros muertos" value={ternerosMuertos.length} sub="Este año" color="red" />
      </div>
      <Card className="p-4">
        <h3 className="font-heading font-semibold mb-3">Hembras por revisar</h3>
        {vacias > 0 ? (
          <div className="space-y-2">
            {hembras.filter(h => !preñadas.includes(h)).map(h => (
              <div key={h.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                <span className="text-sm font-medium">#{h.numero}</span>
                <span className="text-xs text-amber-700">Sin preñez confirmada</span>
              </div>
            ))}
          </div>
        ) : <NoData msg="No hay hembras por revisar." />}
      </Card>
    </div>
  );
}

function OvinosRepro({ animals, eventos, today }) {
  const ovejas = animals.filter(a => a.sexo === "hembra" && a.estado === "activo");
  const carneros = animals.filter(a => a.sexo === "macho" && a.estado === "activo");
  const corderos = animals.filter(a => a.fecha_nacimiento && new Date(a.fecha_nacimiento) > new Date("2026-01-01") && a.estado === "activo");
  const corderosMuertos = animals.filter(a => a.fecha_nacimiento && new Date(a.fecha_nacimiento) > new Date("2026-01-01") && a.estado === "muerto");
  const preñadas = ovejas.filter(h => eventos.some(ev => ev.animal_id === h.id && ev.tipo_evento === "reproduccion" && ev.subtipo === "confirmacion_preñez"));
  const partosProx = eventos.filter(ev => ev.especie === "ovino" && ev.tipo_evento === "reproduccion" && ev.subtipo === "parto" && ev.fecha >= today);
  const tasaPreñez = ovejas.length > 0 ? Math.round((preñadas.length / ovejas.length) * 100) : 0;
  const prolificidad = corderos.length > 0 && preñadas.length > 0 ? (corderos.length / preñadas.length).toFixed(1) : "—";
  const mortalidad = (corderos.length + corderosMuertos.length) > 0 ? Math.round((corderosMuertos.length / (corderos.length + corderosMuertos.length)) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Ovejas reproductoras" value={ovejas.length} sub="Activas" color="emerald" />
        <StatCard icon={Heart} label="Ovejas preñadas" value={preñadas.length} sub={`Tasa: ${tasaPreñez}%`} color="purple" />
        <StatCard icon={AlertCircle} label="Ovejas vacías" value={ovejas.length - preñadas.length} sub="Sin preñez" color="amber" />
        <StatCard icon={Activity} label="Prolificidad prom." value={prolificidad} sub="Corderos/parto" color="blue" />
        <StatCard icon={Baby} label="Corderos nacidos" value={corderos.length} sub="Este año" color="emerald" />
        <StatCard icon={AlertTriangle} label="Mortalidad corderos" value={`${mortalidad}%`} sub={`${corderosMuertos.length} muertos`} color="red" />
        <StatCard icon={Baby} label="Partos próximos" value={partosProx.length} sub="Próximos" color="blue" />
        <StatCard icon={Activity} label="Días abiertos prom." value="—" sub="Sin datos suficientes" color="gray" />
      </div>
      <Card className="p-4">
        <h3 className="font-heading font-semibold mb-3">Ovejas por revisar</h3>
        {ovejas.filter(h => !preñadas.includes(h)).length > 0 ? (
          <div className="space-y-2">
            {ovejas.filter(h => !preñadas.includes(h)).map(h => (
              <div key={h.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                <span className="text-sm font-medium">#{h.numero}</span>
                <span className="text-xs text-amber-700">Requiere revisión reproductiva</span>
              </div>
            ))}
          </div>
        ) : <NoData msg="No hay ovejas por revisar." />}
      </Card>
    </div>
  );
}

function EquinosRepro({ yeguas, inseminaciones, confirmaciones, partos, colectas, despachos, inconformidades, reproductores, today }) {
  const yeguasActivas = yeguas.filter(y => y.estado_reproductivo !== "retirada");
  const preñadas = yeguas.filter(y => y.estado_reproductivo === "preñada");
  const receptoras = yeguas.filter(y => y.nombre?.toLowerCase().includes("receptora") || y.numero?.includes("RECEP") || y.estado_reproductivo === "vacia");
  const receptorasPreñadas = receptoras.filter(y => y.estado_reproductivo === "preñada" || y.estado_reproductivo === "inseminada");
  const transferencias = inseminaciones.filter(i => i.tipo === "transferencia_embriones" || i.tipo_servicio === "transferencia_embriones");
  const preñecesConfirmadas = confirmaciones.length;
  const tasaPreñez = inseminaciones.length > 0 ? Math.round((preñecesConfirmadas / inseminaciones.length) * 100) : 0;
  const repeticiones = yeguas.reduce((s, y) => s + (y.repeticiones_celo || 0), 0);
  const partosProx = yeguas.filter(y => y.fecha_probable_parto && y.fecha_probable_parto >= today);
  const inconformidadesAbiertas = inconformidades.filter(i => i.estado === "abierta");

  const despachosPorReproductor = useMemo(() => {
    const map = {};
    despachos.forEach(d => {
      const name = d.reproductor || "Sin nombre";
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 18) + "…" : name, count }));
  }, [despachos]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Yeguas reproductivas" value={yeguasActivas.length} sub="Activas" color="emerald" />
        <StatCard icon={Heart} label="Yeguas preñadas" value={preñadas.length} sub={`Tasa: ${tasaPreñez}%`} color="purple" />
        <StatCard icon={Users} label="Receptoras activas" value={receptoras.length} sub={`${receptorasPreñadas.length} inseminadas`} color="blue" />
        <StatCard icon={FlaskConical} label="Transferencias" value={transferencias.length} sub="Realizadas" color="amber" />
        <StatCard icon={Heart} label="Preñeces confirmadas" value={preñecesConfirmadas} sub="Total" color="emerald" />
        <StatCard icon={Activity} label="Tasa éxito/transf." value={`${tasaPreñez}%`} sub="Por transferencia" color="blue" />
        <StatCard icon={Baby} label="Partos próximos" value={partosProx.length} sub="Próximos" color="amber" />
        <StatCard icon={AlertTriangle} label="Repeticiones" value={repeticiones} sub="Celos repetidos" color="red" />
        <StatCard icon={FlaskConical} label="Colectas" value={colectas.length} sub="Total" color="emerald" />
        <StatCard icon={Truck} label="Despachos" value={despachos.length} sub="Total" color="blue" />
        <StatCard icon={AlertTriangle} label="Inconformidades" value={inconformidadesAbiertas.length} sub="Abiertas" color="red" />
        <StatCard icon={Users} label="Reproductores" value={reproductores.filter(r => r.estado === "activo").length} sub="Activos" color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-heading font-semibold mb-3">Despachos por reproductor</h3>
          {despachosPorReproductor.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={despachosPorReproductor} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4a90d9" name="Despachos" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <NoData />}
        </Card>
        <Card className="p-4">
          <h3 className="font-heading font-semibold mb-3">Partos próximos (30 días)</h3>
          {partosProx.length > 0 ? (
            <div className="space-y-2">
              {partosProx.map(y => (
                <div key={y.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">{y.nombre}</span>
                  <span className="text-xs text-blue-700">{y.fecha_probable_parto}</span>
                </div>
              ))}
            </div>
          ) : <NoData msg="Sin partos próximos." />}
        </Card>
      </div>
    </div>
  );
}

export default function ReproduccionGenetica({
  especieFilter, animals, yeguas, inseminaciones, confirmaciones, partos,
  colectas, despachos, inconformidades, reproductores, eventos
}) {
  const today = new Date().toISOString().split("T")[0];

  if (especieFilter === "bovino") return <BovinosRepro animals={animals} eventos={eventos} today={today} />;
  if (especieFilter === "ovino") return <OvinosRepro animals={animals} eventos={eventos} today={today} />;
  if (especieFilter === "equino") return (
    <EquinosRepro
      yeguas={yeguas} inseminaciones={inseminaciones} confirmaciones={confirmaciones}
      partos={partos} colectas={colectas} despachos={despachos}
      inconformidades={inconformidades} reproductores={reproductores} today={today}
    />
  );

  return (
    <Card className="p-8 text-center">
      <Heart className="w-8 h-8 text-amber-500 mx-auto mb-3" />
      <h3 className="font-heading font-semibold mb-1">Selecciona una especie</h3>
      <p className="text-sm text-muted-foreground">
        Filtra por Bovinos, Ovinos o Equinos para ver los indicadores reproductivos específicos de cada especie.
      </p>
    </Card>
  );
}