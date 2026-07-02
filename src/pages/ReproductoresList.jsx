import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, Search, Star, Truck, TestTube, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency } from "@/lib/helpers";
import DeleteConfirmButton from "@/components/shared/DeleteConfirmButton";

const RAZAS = {
  criollo: "Criollo", appaloosa: "Appaloosa", cuarto_de_milla: "Cuarto de Milla",
  pinto_americano: "Pinto Americano", pura_sangre_espanol: "Pura Sangre Español",
  pura_sangre_lusitano: "Pura Sangre Lusitano", otra: "Otra",
};
const ESTADO_COLORS = {
  activo: "bg-green-100 text-green-800", inactivo: "bg-gray-100 text-gray-600",
  retirado: "bg-orange-100 text-orange-800", vendido: "bg-blue-100 text-blue-800",
  muerto: "bg-red-100 text-red-800",
};
const ESTADO_LABELS = { activo: "Activo", inactivo: "Inactivo", retirado: "Retirado", vendido: "Vendido", muerto: "Muerto" };

export default function ReproductoresList() {
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [filterRaza, setFilterRaza] = useState("all");

  const { data: reproductores = [], isLoading } = useQuery({ queryKey: ["reproductores"], queryFn: () => base44.entities.Reproductor.list() });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: colectas = [] } = useQuery({ queryKey: ["colectas"], queryFn: () => base44.entities.Colecta.list() });
  const { data: despachos = [] } = useQuery({ queryKey: ["despachos"], queryFn: () => base44.entities.Despacho.list() });
  const { data: inconformidades = [] } = useQuery({ queryKey: ["inconformidades"], queryFn: () => base44.entities.Inconformidad.list() });

  const filtered = useMemo(() => reproductores.filter(r => {
    if (filterEstado !== "all" && r.estado !== filterEstado) return false;
    if (filterRaza !== "all" && r.raza !== filterRaza) return false;
    if (search && !r.nombre?.toLowerCase().includes(search.toLowerCase()) && !r.raza?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [reproductores, filterEstado, filterRaza, search]);

  const getStats = (rId) => {
    const rColectas = colectas.filter(c => c.reproductor_id === rId);
    const rDespachos = despachos.filter(d => d.reproductor_id === rId);
    const rInconformidades = inconformidades.filter(i => i.reproductor_id === rId && i.estado === "abierta");
    const totalDosis = rColectas.reduce((s, c) => s + (c.numero_dosis || 0), 0);
    const totalVentas = rDespachos.reduce((s, d) => s + (d.valor_cobrado || 0), 0);
    const ultimaColecta = rColectas.sort((a, b) => b.fecha?.localeCompare(a.fecha))[0]?.fecha;
    return { colectas: rColectas.length, despachos: rDespachos.length, totalDosis, totalVentas, inconformidades: rInconformidades.length, ultimaColecta };
  };

  const getFinca = (id) => fincas.find(f => f.id === id)?.nombre || "—";

  return (
    <div className="space-y-4">
      <PageHeader title="Reproductores" subtitle={`${filtered.length} registrados`}>
        <Link to="/reproductores/nuevo">
          <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold">
            <Plus className="w-4 h-4" /> Nuevo Reproductor
          </Button>
        </Link>
      </PageHeader>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar reproductor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(ESTADO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterRaza} onValueChange={setFilterRaza}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Raza" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las razas</SelectItem>
            {Object.entries(RAZAS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Activos", value: reproductores.filter(r => r.estado === "activo").length, color: "text-green-600" },
          { label: "Total colectas", value: colectas.length, color: "text-amber-600" },
          { label: "Total dosis", value: colectas.reduce((s, c) => s + (c.numero_dosis || 0), 0), color: "text-blue-600" },
          { label: "Inconformidades abiertas", value: inconformidades.filter(i => i.estado === "abierta").length, color: "text-red-600" },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-heading font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && !isLoading ? (
        <Card className="p-12 text-center">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground mb-4">No hay reproductores registrados</p>
          <Link to="/reproductores/nuevo">
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Registrar primer reproductor
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(r => {
            const stats = getStats(r.id);
            return (
              <Link to={`/reproductores/${r.id}`} key={r.id}>
                <Card className="p-4 hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-amber-400">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading font-bold text-lg">{r.nombre}</h3>
                      <p className="text-sm text-muted-foreground">{RAZAS[r.raza] || r.raza} · {getFinca(r.finca_id)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ESTADO_COLORS[r.estado] || "bg-gray-100 text-gray-600"}`}>
                          {ESTADO_LABELS[r.estado] || r.estado}
                        </span>
                        {r.tipo === "externo" && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">Externo</span>}
                        <DeleteConfirmButton entityName="Reproductor" recordId={r.id} recordLabel={`el reproductor "${r.nombre}"`} queryKeysToInvalidate={["reproductores"]} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-base font-bold">{stats.colectas}</p>
                      <p className="text-[10px] text-muted-foreground">Colectas</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-base font-bold">{stats.totalDosis}</p>
                      <p className="text-[10px] text-muted-foreground">Dosis</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-base font-bold">{stats.despachos}</p>
                      <p className="text-[10px] text-muted-foreground">Despachos</p>
                    </div>
                    <div className={`rounded-lg p-2 ${stats.inconformidades > 0 ? "bg-red-50" : "bg-muted/50"}`}>
                      <p className={`text-base font-bold ${stats.inconformidades > 0 ? "text-red-600" : ""}`}>{stats.inconformidades}</p>
                      <p className="text-[10px] text-muted-foreground">Novedades</p>
                    </div>
                  </div>
                  {stats.ultimaColecta && (
                    <p className="text-xs text-muted-foreground mt-2">Última colecta: {stats.ultimaColecta}</p>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}