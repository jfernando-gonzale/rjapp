import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Weight } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import GainIndicator from "@/components/shared/GainIndicator";
import { formatCurrency, formatWeight, daysBetween, calcDailyGain, CATEGORIA_GASTOS } from "@/lib/helpers";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const COLORS = ["#2d9d78", "#e8a838", "#e05252", "#4a90d9", "#8b5cf6", "#f97316", "#06b6d4", "#84cc16"];

export default function Reportes() {
  const [filterEspecie, setFilterEspecie] = useState("all");
  const [filterFinca, setFilterFinca] = useState("all");
  const [filterLote, setFilterLote] = useState("all");

  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });
  const { data: gastos = [] } = useQuery({ queryKey: ["gastos"], queryFn: () => base44.entities.Gasto.list() });
  const { data: ventas = [] } = useQuery({ queryKey: ["ventas"], queryFn: () => base44.entities.Venta.list() });

  const filteredLotes = filterFinca === "all" ? lotes : lotes.filter(l => l.finca_id === filterFinca);

  const filteredAnimals = useMemo(() => animals.filter(a => {
    if (filterEspecie !== "all" && (a.especie || "bovino") !== filterEspecie) return false;
    if (filterFinca !== "all" && a.finca_id !== filterFinca) return false;
    if (filterLote !== "all" && a.lote_id !== filterLote) return false;
    return true;
  }), [animals, filterEspecie, filterFinca, filterLote]);

  const filteredGastos = useMemo(() => gastos.filter(g => {
    if (filterEspecie !== "all" && g.especie && g.especie !== filterEspecie && g.especie !== "general") return false;
    if (filterFinca !== "all" && g.finca_id !== filterFinca) return false;
    if (filterLote !== "all" && g.lote_id !== filterLote) return false;
    return true;
  }), [gastos, filterEspecie, filterFinca, filterLote]);

  const filteredVentas = useMemo(() => ventas.filter(v => {
    if (filterEspecie !== "all" && v.especie && v.especie !== filterEspecie) return false;
    if (filterFinca !== "all" && v.finca_id !== filterFinca) return false;
    if (filterLote !== "all" && v.lote_id !== filterLote) return false;
    return true;
  }), [ventas, filterEspecie, filterFinca, filterLote]);

  const activeAnimals = filteredAnimals.filter(a => a.estado === "activo");
  const withWeight = activeAnimals.filter(a => a.ultimo_peso);
  const avgWeight = withWeight.length > 0 ? withWeight.reduce((s, a) => s + a.ultimo_peso, 0) / withWeight.length : 0;
  const totalGastos = filteredGastos.reduce((s, g) => s + (g.valor || 0), 0);
  const totalVentas = filteredVentas.reduce((s, v) => s + (v.precio_total || 0), 0);
  const totalInvested = filteredAnimals.reduce((s, a) => s + (a.precio_compra || 0), 0);
  const utilidadNeta = totalVentas - totalInvested - totalGastos;

  const gastosByCat = useMemo(() => {
    const map = {};
    filteredGastos.forEach(g => {
      const cat = g.categoria || "otros";
      map[cat] = (map[cat] || 0) + (g.valor || 0);
    });
    return Object.entries(map).map(([k, v]) => ({ name: CATEGORIA_GASTOS[k] || k, value: v })).sort((a, b) => b.value - a.value);
  }, [filteredGastos]);

  const utilidadByLote = useMemo(() => {
    return filteredLotes.map(l => {
      const lAnimals = filteredAnimals.filter(a => a.lote_id === l.id);
      const inv = lAnimals.reduce((s, a) => s + (a.precio_compra || 0), 0);
      const gas = filteredGastos.filter(g => g.lote_id === l.id).reduce((s, g) => s + (g.valor || 0), 0);
      const ven = filteredVentas.filter(v => v.lote_id === l.id).reduce((s, v) => s + (v.precio_total || 0), 0);
      return { name: l.nombre, utilidad: ven - inv - gas, ventas: ven, gastos: inv + gas };
    });
  }, [filteredLotes, filteredAnimals, filteredGastos, filteredVentas]);

  const animalGains = useMemo(() => {
    return activeAnimals.filter(a => a.ultimo_peso && a.peso_compra && a.fecha_compra && a.fecha_ultimo_pesaje).map(a => {
      const days = daysBetween(a.fecha_compra, a.fecha_ultimo_pesaje);
      const gain = days > 0 ? calcDailyGain(a.ultimo_peso, a.peso_compra, days) : 0;
      return { numero: a.numero, gain, peso: a.ultimo_peso, id: a.id };
    }).sort((a, b) => b.gain - a.gain);
  }, [activeAnimals]);

  const especieTitle = { all: "General", bovino: "Bovinos 🐄", ovino: "Ovinos 🐑", equino: "Equinos 🐴" };

  return (
    <div>
      <PageHeader title="Reportes" subtitle={`Análisis · ${especieTitle[filterEspecie]}`} />

      {/* Filtros — especie primero */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          { key: "all", label: "Todas las especies" },
          { key: "bovino", label: "🐄 Bovinos" },
          { key: "ovino", label: "🐑 Ovinos" },
          { key: "equino", label: "🐴 Equinos" },
        ].map(e => (
          <button key={e.key} onClick={() => setFilterEspecie(e.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filterEspecie === e.key ? "bg-amber-500 text-black border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
            }`}>{e.label}</button>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Select value={filterFinca} onValueChange={(v) => { setFilterFinca(v); setFilterLote("all"); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Finca" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fincas</SelectItem>
            {fincas.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterLote} onValueChange={setFilterLote}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Lote" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los lotes</SelectItem>
            {filteredLotes.map(l => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard title="Animales activos" value={activeAnimals.length} icon={TrendingUp} color="primary" />
        <StatCard title="Peso promedio" value={formatWeight(avgWeight)} icon={Weight} color="blue" />
        <StatCard title="Total gastos" value={formatCurrency(totalGastos)} icon={DollarSign} color="accent" />
        <StatCard title="Utilidad neta" value={formatCurrency(utilidadNeta)} icon={ShoppingCart} color={utilidadNeta >= 0 ? "success" : "danger"} />
      </div>

      <Tabs defaultValue="gastos" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
          <TabsTrigger value="utilidad">Utilidad</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="gastos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-heading font-semibold mb-3">Gastos por categoría</h3>
              {gastosByCat.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gastosByCat} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Bar dataKey="value" fill="hsl(36, 80%, 50%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
            </Card>
            <Card className="p-4">
              <h3 className="font-heading font-semibold mb-3">Distribución de gastos</h3>
              {gastosByCat.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={gastosByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {gastosByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="utilidad">
          <Card className="p-4">
            <h3 className="font-heading font-semibold mb-3">Utilidad por lote</h3>
            {utilidadByLote.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilidadByLote}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="ventas" fill="#2d9d78" name="Ventas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gastos" fill="#e8a838" name="Inversión" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="utilidad" fill="#4a90d9" name="Utilidad" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos de lotes</p>}
          </Card>
        </TabsContent>

        <TabsContent value="ranking">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-heading font-semibold mb-3 text-emerald-600">Mejor ganancia diaria</h3>
              {animalGains.length > 0 ? (
                <div className="space-y-2">
                  {animalGains.slice(0, 10).map((a, i) => (
                    <div key={a.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                        <span className="font-medium">#{a.numero}</span>
                        <span className="text-sm text-muted-foreground">{formatWeight(a.peso)}</span>
                      </div>
                      <GainIndicator dailyGain={a.gain} />
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
            </Card>
            <Card className="p-4">
              <h3 className="font-heading font-semibold mb-3 text-red-600">Menor ganancia diaria</h3>
              {animalGains.length > 0 ? (
                <div className="space-y-2">
                  {[...animalGains].reverse().slice(0, 10).map((a, i) => (
                    <div key={a.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                        <span className="font-medium">#{a.numero}</span>
                        <span className="text-sm text-muted-foreground">{formatWeight(a.peso)}</span>
                      </div>
                      <GainIndicator dailyGain={a.gain} />
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}