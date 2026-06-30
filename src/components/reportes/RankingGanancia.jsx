import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Eye } from "lucide-react";
import { formatWeight } from "@/lib/helpers";
import { calcGainFromPesajes, classifyGain, isPotro } from "@/lib/gananciaUtils";

function GainBadge({ gain, especie, thresholds }) {
  const c = classifyGain(gain, especie, thresholds);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {gain != null ? `${gain.toFixed(2)} kg/día` : "—"}
      <span className="opacity-70">· {c.label}</span>
    </span>
  );
}

function Row({ entry, rank, accent }) {
  const { c: cls } = entry;
  return (
    <div className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 ${accent}`}>
          {rank}
        </span>
        <div className="min-w-0">
          <span className="font-medium text-sm">#{entry.numero}</span>
          {entry.raza && <span className="text-xs text-muted-foreground ml-1">· {entry.raza}</span>}
          <p className="text-xs text-muted-foreground">
            {formatWeight(entry.pesoActual)} · {entry.fecha}
          </p>
        </div>
      </div>
      <GainBadge gain={entry.gain} especie={entry.especie} thresholds={entry.thresholds} />
    </div>
  );
}

export default function RankingGanancia({ animals, pesajes, especieFilter, fincaFilter, loteFilter, thresholds }) {
  const [includeInactive, setIncludeInactive] = useState(false);

  const animalGains = useMemo(() => {
    const pesajesByAnimal = {};
    (pesajes || []).forEach(p => {
      if (!pesajesByAnimal[p.animal_id]) pesajesByAnimal[p.animal_id] = [];
      pesajesByAnimal[p.animal_id].push(p);
    });

    return (animals || [])
      .filter(a => {
        if (!includeInactive && a.estado !== "activo") return false;
        if (especieFilter !== "all" && (a.especie || "bovino") !== especieFilter) return false;
        if (fincaFilter !== "all" && a.finca_id !== fincaFilter) return false;
        if (loteFilter !== "all" && a.lote_id !== loteFilter) return false;
        const esp = a.especie || "bovino";
        if (esp === "equino" && !isPotro(a)) return false;
        return true;
      })
      .map(a => {
        const especie = a.especie || "bovino";
        const gainInfo = calcGainFromPesajes(pesajesByAnimal[a.id] || []);
        if (!gainInfo) return null;
        return {
          id: a.id,
          numero: a.numero,
          nombre: a.nombre,
          especie,
          raza: a.raza,
          thresholds,
          ...gainInfo,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.gain - a.gain);
  }, [animals, pesajes, especieFilter, fincaFilter, loteFilter, includeInactive, thresholds]);

  if (animalGains.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">Sin datos suficientes para el ranking.</p>
        <p className="text-xs text-muted-foreground mt-1">Se necesitan al menos 2 pesajes por animal.</p>
      </Card>
    );
  }

  if (animalGains.length < 6) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold">Ranking de ganancia diaria</h3>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)} className="rounded" />
            Incluir no activos
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="pb-2 pr-3">#</th>
                <th className="pb-2 pr-3">Animal</th>
                <th className="pb-2 pr-3">Especie</th>
                <th className="pb-2 pr-3">Peso actual</th>
                <th className="pb-2 pr-3">Ganancia diaria</th>
                <th className="pb-2 pr-3">Clasificación</th>
                <th className="pb-2">Último pesaje</th>
              </tr>
            </thead>
            <tbody>
              {animalGains.map((a, i) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-bold text-muted-foreground">{i + 1}</td>
                  <td className="py-2 pr-3 font-medium">#{a.numero}</td>
                  <td className="py-2 pr-3 capitalize">{a.especie}</td>
                  <td className="py-2 pr-3">{formatWeight(a.pesoActual)}</td>
                  <td className="py-2 pr-3">{a.gain.toFixed(2)} kg/día</td>
                  <td className="py-2 pr-3">
                    <GainBadge gain={a.gain} especie={a.especie} thresholds={thresholds} />
                  </td>
                  <td className="py-2 text-muted-foreground">{a.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Se muestran {animalGains.length} animal{animalGains.length !== 1 ? "es" : ""} con datos válidos (menos de 6, lista única).
        </p>
      </Card>
    );
  }

  const best = animalGains.slice(0, 5);
  const bestIds = new Set(best.map(a => a.id));
  const worst = [...animalGains].reverse().filter(a => !bestIds.has(a.id)).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)} className="rounded" />
          Incluir animales no activos
        </label>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-heading font-semibold mb-3 text-emerald-600 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Mejor ganancia diaria
          </h3>
          <div className="space-y-2">
            {best.map((a, i) => (
              <Row key={a.id} entry={a} rank={i + 1} accent="bg-emerald-100 text-emerald-700" />
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-heading font-semibold mb-3 text-red-600 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" /> Menor ganancia diaria
          </h3>
          <div className="space-y-2">
            {worst.map((a, i) => (
              <Row key={a.id} entry={a} rank={i + 1} accent="bg-red-100 text-red-700" />
            ))}
          </div>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Top 5 mejores y top 5 peores · {animalGains.length} animales con datos válidos · Sin duplicados entre listas
      </p>
    </div>
  );
}