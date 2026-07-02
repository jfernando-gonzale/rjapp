import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Layers, Pencil } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import DeleteConfirmButton from "@/components/shared/DeleteConfirmButton";
import { formatCurrency, formatWeight, TIPO_LOTE } from "@/lib/helpers";

const ESPECIE_LOTE = { bovino: "🐄 Bovino", ovino: "🐑 Ovino", equino: "🐴 Equino", mixto: "🌿 Mixto" };
const ESPECIE_COLORS = {
  bovino: "bg-amber-100 text-amber-800",
  ovino: "bg-green-100 text-green-800",
  equino: "bg-blue-100 text-blue-800",
  mixto: "bg-gray-100 text-gray-600",
};

export default function Lotes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterEspecie, setFilterEspecie] = useState("all");
  const [filterFinca, setFilterFinca] = useState("all");
  const [filterEstado, setFilterEstado] = useState("all");
  const queryClient = useQueryClient();

  const { data: lotes = [], isLoading } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });
  const { data: gastos = [] } = useQuery({ queryKey: ["gastos"], queryFn: () => base44.entities.Gasto.list() });
  const { data: ventas = [] } = useQuery({ queryKey: ["ventas"], queryFn: () => base44.entities.Venta.list() });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lote.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lotes"] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lote.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lotes"] }); setDialogOpen(false); setEditing(null); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const filtered = useMemo(() => lotes.filter(l => {
    if (filterEspecie !== "all" && l.especie !== filterEspecie) return false;
    if (filterFinca !== "all" && l.finca_id !== filterFinca) return false;
    if (filterEstado !== "all" && l.estado !== filterEstado) return false;
    return true;
  }), [lotes, filterEspecie, filterFinca, filterEstado]);

  const getLoteStats = (loteId) => {
    const loteAnimals = animals.filter(a => a.lote_id === loteId && a.estado === "activo");
    const withWeight = loteAnimals.filter(a => a.ultimo_peso);
    const avgWeight = withWeight.length > 0 ? withWeight.reduce((s, a) => s + a.ultimo_peso, 0) / withWeight.length : 0;
    const loteGastos = gastos.filter(g => g.lote_id === loteId).reduce((s, g) => s + (g.valor || 0), 0);
    const loteVentas = ventas.filter(v => v.lote_id === loteId).reduce((s, v) => s + (v.precio_total || 0), 0);
    return { count: loteAnimals.length, avgWeight, gastos: loteGastos, ventas: loteVentas };
  };

  const getFincaName = (id) => fincas.find(f => f.id === id)?.nombre || "—";

  return (
    <div>
      <PageHeader title="Lotes / Potreros" subtitle={`${filtered.length} lotes`} actionLabel="Nuevo Lote" onAction={() => { setEditing(null); setDialogOpen(true); }} />

      {/* Filtros especie */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          { key: "all", label: "Todas las especies" },
          { key: "bovino", label: "🐄 Bovinos" },
          { key: "ovino", label: "🐑 Ovinos" },
          { key: "equino", label: "🐴 Equinos" },
          { key: "mixto", label: "🌿 Mixto" },
        ].map(e => (
          <button key={e.key} onClick={() => setFilterEspecie(e.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filterEspecie === e.key ? "bg-amber-500 text-black border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
            }`}>{e.label}</button>
        ))}
      </div>

      {/* Filtros adicionales */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Select value={filterFinca} onValueChange={setFilterFinca}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Finca" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fincas</SelectItem>
            {fincas.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="cerrado">Cerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={Layers} title="Sin lotes" description="Crea lotes para agrupar tus animales" actionLabel="Nuevo Lote" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lote) => {
            const stats = getLoteStats(lote.id);
            return (
              <Card key={lote.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading font-bold">{lote.nombre}</h3>
                    <p className="text-xs text-muted-foreground">{getFincaName(lote.finca_id)}</p>
                    {lote.especie && (
                      <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold mt-1 ${ESPECIE_COLORS[lote.especie] || "bg-gray-100 text-gray-600"}`}>
                        {ESPECIE_LOTE[lote.especie] || lote.especie}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusBadge status={lote.tipo} label={TIPO_LOTE[lote.tipo] || lote.tipo} color="blue" />
                    <StatusBadge status={lote.estado} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(lote); setDialogOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <DeleteConfirmButton
                      entityName="Lote"
                      recordId={lote.id}
                      recordLabel={`el lote "${lote.nombre}"`}
                      warningText={stats.count > 0 ? `Este lote tiene ${stats.count} animales asociados. Traslada o elimina esos animales antes de borrar este registro.` : undefined}
                      queryKeysToInvalidate={["lotes"]}
                      disabled={stats.count > 0}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-bold">{stats.count}</p>
                    <p className="text-xs text-muted-foreground">Animales</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-bold">{formatWeight(stats.avgWeight)}</p>
                    <p className="text-xs text-muted-foreground">Peso prom.</p>
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Gastos: {formatCurrency(stats.gastos)}</span>
                  <span>Ventas: {formatCurrency(stats.ventas)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Editar Lote" : "Nuevo Lote"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input name="nombre" defaultValue={editing?.nombre} required placeholder="Ej: Lote Ceba 1" />
            </div>
            <div>
              <Label>Finca *</Label>
              <Select name="finca_id" defaultValue={editing?.finca_id} required>
                <SelectTrigger><SelectValue placeholder="Seleccionar finca" /></SelectTrigger>
                <SelectContent>
                  {fincas.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Especie principal</Label>
              <Select name="especie" defaultValue={editing?.especie || "bovino"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bovino">🐄 Bovino</SelectItem>
                  <SelectItem value="ovino">🐑 Ovino</SelectItem>
                  <SelectItem value="equino">🐴 Equino</SelectItem>
                  <SelectItem value="mixto">🌿 Mixto / General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de lote</Label>
              <Select name="tipo" defaultValue={editing?.tipo || "ceba"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_LOTE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha de inicio</Label>
              <Input name="fecha_inicio" type="date" defaultValue={editing?.fecha_inicio} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select name="estado" defaultValue={editing?.estado || "activo"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea name="observaciones" defaultValue={editing?.observaciones} />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Guardar cambios" : "Crear Lote"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}