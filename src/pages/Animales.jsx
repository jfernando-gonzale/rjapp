import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, Plus, Filter, LayoutGrid, LayoutList, Layers } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import GainIndicator from "@/components/shared/GainIndicator";
import CsvExportButton from "@/components/shared/CsvExportButton";
import ImportCsvDialog from "@/components/shared/ImportCsvDialog";
import { formatCurrency, formatWeight, daysBetween, calcDailyGain, ESTADO_ANIMAL, SEXO_ANIMAL } from "@/lib/helpers";
import { useQueryClient } from "@tanstack/react-query";

const ESPECIE_LABELS = { bovino: "🐄 Bovino", ovino: "🐑 Ovino", equino: "🐴 Equino" };
const ESPECIE_TERMINOS = {
  bovino: { macho: "Toro / Novillo", hembra: "Vaca / Novilla" },
  ovino: { macho: "Carnero", hembra: "Oveja / Borrega" },
  equino: { macho: "Reproductor / Padrillo", hembra: "Yegua / Receptora" },
};

export default function Animales() {
  const urlParams = new URLSearchParams(window.location.search);
  const [search, setSearch] = useState("");
  const [filterEspecie, setFilterEspecie] = useState(urlParams.get("especie") || "all");
  const [filterFinca, setFilterFinca] = useState("all");
  const [filterLote, setFilterLote] = useState("all");
  const [filterEstado, setFilterEstado] = useState("all");
  const [filterSexo, setFilterSexo] = useState("all");
  const [viewMode, setViewMode] = useState("cards");
  const [showFilters, setShowFilters] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: animals = [], isLoading } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });

  const filtered = useMemo(() => {
    return animals.filter(a => {
      if (search && !a.numero?.toLowerCase().includes(search.toLowerCase()) && !a.nombre?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterEspecie !== "all" && a.especie !== filterEspecie) return false;
      if (filterFinca !== "all" && a.finca_id !== filterFinca) return false;
      if (filterLote !== "all" && a.lote_id !== filterLote) return false;
      if (filterEstado !== "all" && a.estado !== filterEstado) return false;
      if (filterSexo !== "all" && a.sexo !== filterSexo) return false;
      return true;
    });
  }, [animals, search, filterEspecie, filterFinca, filterLote, filterEstado, filterSexo]);

  const getFincaName = (id) => fincas.find(f => f.id === id)?.nombre || "—";
  const getLoteName = (id) => lotes.find(l => l.id === id)?.nombre || "—";

  const getAnimalGain = (animal) => {
    if (!animal.ultimo_peso || !animal.peso_compra) return null;
    const days = animal.fecha_ultimo_pesaje && animal.fecha_compra
      ? daysBetween(animal.fecha_compra, animal.fecha_ultimo_pesaje) : null;
    if (!days || days === 0) return null;
    return calcDailyGain(animal.ultimo_peso, animal.peso_compra, days);
  };

  const getEspecieBadge = (especie) => {
    const map = { bovino: "bg-amber-100 text-amber-800", ovino: "bg-green-100 text-green-800", equino: "bg-blue-100 text-blue-800" };
    return map[especie] || "bg-gray-100 text-gray-600";
  };

  const importFields = [
    { key: "numero", label: "Número / Chapeta", required: true },
    { key: "especie", label: "Especie (bovino/ovino/equino)" },
    { key: "sexo", label: "Sexo (macho/hembra)" },
    { key: "raza", label: "Raza" },
    { key: "peso_compra", label: "Peso compra (kg)" },
    { key: "precio_compra", label: "Precio compra" },
    { key: "fecha_compra", label: "Fecha compra" },
    { key: "color", label: "Color" },
    { key: "estado", label: "Estado (activo/vendido/...)" },
  ];

  const handleImportAnimals = async (rows) => {
    const defaultFinca = fincas[0]?.id;
    const existentes = new Set(animals.map((a) => `${a.numero}|${a.especie || "bovino"}`));
    const nuevos = [];
    const duplicados = [];
    rows.forEach((r) => {
      const esp = r.especie || "bovino";
      const key = `${r.numero}|${esp}`;
      if (existentes.has(key)) { duplicados.push(r.numero); return; }
      nuevos.push({
        numero: r.numero, especie: esp, finca_id: defaultFinca,
        sexo: r.sexo || undefined, raza: r.raza || undefined, color: r.color || undefined,
        estado: r.estado || "activo", peso_compra: parseFloat(r.peso_compra) || undefined,
        precio_compra: parseFloat(r.precio_compra) || undefined, fecha_compra: r.fecha_compra || undefined,
      });
    });
    if (nuevos.length > 0) await base44.entities.Animal.bulkCreate(nuevos);
    queryClient.invalidateQueries({ queryKey: ["animals"] });
    if (duplicados.length > 0) {
      alert(`Importación completada: ${nuevos.length} animales creados. Se ignoraron ${duplicados.length} duplicados: ${duplicados.slice(0, 10).join(", ")}`);
    }
  };

  return (
    <div>
      <PageHeader title="Animales" subtitle={`${filtered.length} de ${animals.length} animales`}>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
            <Filter className="w-4 h-4" />
          </Button>
          <div className="hidden sm:flex border rounded-lg overflow-hidden">
            <button className={`px-3 py-1.5 text-sm ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => setViewMode("cards")}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button className={`px-3 py-1.5 text-sm ${viewMode === "table" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => setViewMode("table")}>
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
          <CsvExportButton
            data={filtered}
            filename="animales"
            columns={[
              { key: "numero", label: "Número" }, { key: "especie", label: "Especie" }, { key: "nombre", label: "Nombre" },
              { key: "sexo", label: "Sexo" }, { key: "raza", label: "Raza" }, { key: "color", label: "Color" },
              { key: "estado", label: "Estado" }, { key: "ultimo_peso", label: "Último peso" },
              { key: "peso_compra", label: "Peso compra" }, { key: "precio_compra", label: "Precio compra" },
              { key: "fecha_compra", label: "Fecha compra" }, { key: "fecha_nacimiento", label: "Fecha nacimiento" },
            ]}
          />
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-2 h-8"><Layers className="w-4 h-4" /> Importar</Button>
          <Link to="/animales/masivo">
            <Button variant="outline" size="sm" className="gap-2 h-8"><Plus className="w-4 h-4" /> Masivo</Button>
          </Link>
          <Link to="/animales/nuevo">
            <Button className="gap-2 font-medium"><Plus className="w-4 h-4" /> Nuevo Animal</Button>
          </Link>
        </div>
      </PageHeader>

      {/* Filtro rápido por especie */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          { key: "all", label: "Todas" },
          { key: "bovino", label: "🐄 Bovinos" },
          { key: "ovino", label: "🐑 Ovinos" },
          { key: "equino", label: "🐴 Equinos" },
        ].map(e => (
          <button
            key={e.key}
            onClick={() => setFilterEspecie(e.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filterEspecie === e.key
                ? "bg-amber-500 text-black border-amber-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por número o nombre..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-2 ${showFilters ? '' : 'hidden lg:grid'}`}>
          <Select value={filterFinca} onValueChange={setFilterFinca}>
            <SelectTrigger><SelectValue placeholder="Finca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fincas</SelectItem>
              {fincas.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterLote} onValueChange={setFilterLote}>
            <SelectTrigger><SelectValue placeholder="Lote" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los lotes</SelectItem>
              {lotes.map(l => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(ESTADO_ANIMAL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSexo} onValueChange={setFilterSexo}>
            <SelectTrigger><SelectValue placeholder="Sexo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(SEXO_ANIMAL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={() => <span className="text-4xl">🐄</span>} title="Sin animales" description="Registra tu primer animal" actionLabel="Nuevo Animal" onAction={() => window.location.href = "/animales/nuevo"} />
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(animal => {
            const gain = getAnimalGain(animal);
            return (
              <Link key={animal.id} to={`/animales/${animal.id}`}>
                <Card className="p-4 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-bold text-lg">#{animal.numero}</span>
                        {animal.nombre && <span className="text-sm text-muted-foreground">({animal.nombre})</span>}
                        {animal.especie && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${getEspecieBadge(animal.especie)}`}>
                            {ESPECIE_LABELS[animal.especie]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{getFincaName(animal.finca_id)} • {getLoteName(animal.lote_id)}</p>
                      {animal.raza && <p className="text-xs text-muted-foreground">{animal.raza}</p>}
                    </div>
                    <StatusBadge status={animal.estado} label={ESTADO_ANIMAL[animal.estado]} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center bg-muted/50 rounded-lg py-1.5">
                      <p className="font-bold text-sm">{animal.ultimo_peso ? formatWeight(animal.ultimo_peso) : "—"}</p>
                      <p className="text-[10px] text-muted-foreground">Último peso</p>
                    </div>
                    <div className="text-center bg-muted/50 rounded-lg py-1.5">
                      <p className="font-bold text-sm text-xs">
                        {animal.sexo ? (ESPECIE_TERMINOS[animal.especie]?.[animal.sexo] || SEXO_ANIMAL[animal.sexo]) : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Sexo</p>
                    </div>
                    <div className="text-center bg-muted/50 rounded-lg py-1.5">
                      {gain != null ? <GainIndicator dailyGain={gain} /> : <p className="text-xs text-muted-foreground">—</p>}
                      <p className="text-[10px] text-muted-foreground">Ganancia</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">N°</th>
                <th className="text-left p-3 font-medium">Especie</th>
                <th className="text-left p-3 font-medium">Nombre</th>
                <th className="text-left p-3 font-medium">Raza</th>
                <th className="text-left p-3 font-medium">Finca</th>
                <th className="text-right p-3 font-medium">Peso</th>
                <th className="text-left p-3 font-medium">Ganancia</th>
                <th className="text-left p-3 font-medium">Estado</th>
                <th className="text-center p-3 font-medium">Ver</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(animal => {
                const gain = getAnimalGain(animal);
                return (
                  <tr key={animal.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-medium">#{animal.numero}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${getEspecieBadge(animal.especie)}`}>
                        {ESPECIE_LABELS[animal.especie] || "—"}
                      </span>
                    </td>
                    <td className="p-3">{animal.nombre || "—"}</td>
                    <td className="p-3 text-muted-foreground">{animal.raza || "—"}</td>
                    <td className="p-3 text-muted-foreground">{getFincaName(animal.finca_id)}</td>
                    <td className="p-3 text-right font-medium">{animal.ultimo_peso ? formatWeight(animal.ultimo_peso) : "—"}</td>
                    <td className="p-3">{gain != null ? <GainIndicator dailyGain={gain} /> : <span className="text-muted-foreground text-xs">—</span>}</td>
                    <td className="p-3"><StatusBadge status={animal.estado} label={ESTADO_ANIMAL[animal.estado]} /></td>
                    <td className="p-3 text-center">
                      <Link to={`/animales/${animal.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ImportCsvDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        fields={importFields}
        onImport={handleImportAnimals}
        entityLabel="animales"
      />
    </div>
  );
}