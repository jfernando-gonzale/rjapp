import React, { useState } from "react";
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
import { formatCurrency, formatWeight, TIPO_LOTE } from "@/lib/helpers";

export default function Lotes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
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
      <PageHeader title="Lotes" subtitle="Grupos de animales por finca" actionLabel="Nuevo Lote" onAction={() => { setEditing(null); setDialogOpen(true); }} />

      {lotes.length === 0 && !isLoading ? (
        <EmptyState icon={Layers} title="Sin lotes" description="Crea lotes para agrupar tus animales" actionLabel="Nuevo Lote" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lotes.map((lote) => {
            const stats = getLoteStats(lote.id);
            return (
              <Card key={lote.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading font-bold">{lote.nombre}</h3>
                    <p className="text-xs text-muted-foreground">{getFincaName(lote.finca_id)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={lote.tipo} label={TIPO_LOTE[lote.tipo] || lote.tipo} color="blue" />
                    <StatusBadge status={lote.estado} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(lote); setDialogOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
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