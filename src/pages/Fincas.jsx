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
import { Fence, MapPin, User, Pencil } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import DepartamentoMunicipioFields from "@/components/shared/DepartamentoMunicipioFields";
import DeleteConfirmButton from "@/components/shared/DeleteConfirmButton";
import { formatCurrency, formatWeight } from "@/lib/helpers";

export default function Fincas() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();
  const [ubicacionDepto, setUbicacionDepto] = useState("");
  const [ubicacionMuni, setUbicacionMuni] = useState("");

  // Parse "Municipio, Departamento" en valores separados (para editar)
  const parseUbicacion = (ubicacionStr) => {
    if (!ubicacionStr) return { dpto: "", muni: "" };
    const parts = ubicacionStr.split(",").map(s => s.trim());
    if (parts.length >= 2) return { dpto: parts[1], muni: parts[0] };
    return { dpto: "", muni: parts[0] || "" };
  };

  const { data: fincas = [], isLoading } = useQuery({
    queryKey: ["fincas"],
    queryFn: () => base44.entities.Finca.list(),
  });

  const { data: animals = [] } = useQuery({
    queryKey: ["animals"],
    queryFn: () => base44.entities.Animal.list(),
  });

  const { data: gastos = [] } = useQuery({
    queryKey: ["gastos"],
    queryFn: () => base44.entities.Gasto.list(),
  });

  const { data: ventas = [] } = useQuery({
    queryKey: ["ventas"],
    queryFn: () => base44.entities.Venta.list(),
  });

  const { data: lotes = [] } = useQuery({
    queryKey: ["lotes"],
    queryFn: () => base44.entities.Lote.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Finca.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fincas"] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Finca.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fincas"] }); setDialogOpen(false); setEditing(null); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    // ubicación combinada: "Municipio, Departamento"
    data.ubicacion = [ubicacionMuni, ubicacionDepto].filter(Boolean).join(", ");
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (finca) => {
    const { dpto, muni } = parseUbicacion(finca.ubicacion);
    setEditing(finca);
    setUbicacionDepto(dpto);
    setUbicacionMuni(muni);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setUbicacionDepto("");
    setUbicacionMuni("");
    setDialogOpen(true);
  };

  const getFincaStats = (fincaId) => {
    const fincaAnimals = animals.filter(a => a.finca_id === fincaId && a.estado === "activo");
    const fincaGastos = gastos.filter(g => g.finca_id === fincaId);
    const fincaVentas = ventas.filter(v => v.finca_id === fincaId);
    const fincaLotes = lotes.filter(l => l.finca_id === fincaId && l.estado === "activo");
    const withWeight = fincaAnimals.filter(a => a.ultimo_peso);
    const avgWeight = withWeight.length > 0 ? withWeight.reduce((s, a) => s + a.ultimo_peso, 0) / withWeight.length : 0;
    const totalInvested = animals.filter(a => a.finca_id === fincaId).reduce((s, a) => s + (a.precio_compra || 0), 0);
    const totalGastos = fincaGastos.reduce((s, g) => s + (g.valor || 0), 0);
    const totalVentas = fincaVentas.reduce((s, v) => s + (v.precio_total || 0), 0);

    return {
      activeAnimals: fincaAnimals.length,
      avgWeight,
      totalInvested: totalInvested + totalGastos,
      totalVentas,
      utilidad: totalVentas - totalInvested - totalGastos,
      lotes: fincaLotes.length,
    };
  };

  return (
    <div>
      <PageHeader title="Fincas" subtitle="Administra tus fincas" actionLabel="Nueva Finca" onAction={openNew} />

      {fincas.length === 0 && !isLoading ? (
        <EmptyState icon={Fence} title="Sin fincas" description="Registra tu primera finca para comenzar" actionLabel="Nueva Finca" onAction={openNew} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fincas.map((finca) => {
            const stats = getFincaStats(finca.id);
            return (
              <Card key={finca.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Fence className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg">{finca.nombre}</h3>
                      {finca.ubicacion && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{finca.ubicacion}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={finca.estado} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(finca)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <DeleteConfirmButton
                      entityName="Finca"
                      recordId={finca.id}
                      recordLabel={`la finca "${finca.nombre}"`}
                      warningText={stats.activeAnimals > 0 ? `Esta finca tiene ${stats.activeAnimals} animales asociados. Traslada o elimina esos animales antes de borrar este registro.` : undefined}
                      queryKeysToInvalidate={["fincas"]}
                      disabled={stats.activeAnimals > 0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-bold">{stats.activeAnimals}</p>
                    <p className="text-xs text-muted-foreground">Animales</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-bold">{formatWeight(stats.avgWeight)}</p>
                    <p className="text-xs text-muted-foreground">Peso prom.</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-bold">{stats.lotes}</p>
                    <p className="text-xs text-muted-foreground">Lotes</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t flex justify-between text-xs text-muted-foreground">
                  <span>Invertido: {formatCurrency(stats.totalInvested)}</span>
                  <span>Vendido: {formatCurrency(stats.totalVentas)}</span>
                  <span className={stats.utilidad >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                    Utilidad: {formatCurrency(stats.utilidad)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Editar Finca" : "Nueva Finca"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input name="nombre" defaultValue={editing?.nombre} required placeholder="Ej: Finca El Porvenir" />
            </div>
            <DepartamentoMunicipioFields
              departamento={ubicacionDepto}
              municipio={ubicacionMuni}
              onChangeDepartamento={setUbicacionDepto}
              onChangeMunicipio={setUbicacionMuni}
              labels={{ departamento: "Departamento", municipio: "Ciudad / Municipio" }}
            />
            <div>
              <Label>Responsable</Label>
              <Input name="responsable" defaultValue={editing?.responsable} placeholder="Nombre del encargado" />
            </div>
            <div>
              <Label>Estado</Label>
              <Select name="estado" defaultValue={editing?.estado || "activa"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="inactiva">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea name="observaciones" defaultValue={editing?.observaciones} placeholder="Notas adicionales" />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Guardar cambios" : "Crear Finca"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}