import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DollarSign, Plus, ArrowLeft } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { formatCurrency, CATEGORIA_GASTOS } from "@/lib/helpers";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Gastos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const isNew = window.location.pathname.includes("/nuevo");
  const preAnimal = urlParams.get("animal");

  const [dialogOpen, setDialogOpen] = useState(isNew);
  const [filterCat, setFilterCat] = useState("all");
  const [filterFinca, setFilterFinca] = useState("all");

  const { data: gastos = [], isLoading } = useQuery({ queryKey: ["gastos"], queryFn: () => base44.entities.Gasto.list("-fecha", 200) });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });
  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Gasto.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["gastos"] }); setDialogOpen(false); if (isNew) navigate("/gastos"); },
  });

  const filtered = gastos.filter(g => {
    if (filterCat !== "all" && g.categoria !== filterCat) return false;
    if (filterFinca !== "all" && g.finca_id !== filterFinca) return false;
    return true;
  });

  const totalFiltered = filtered.reduce((s, g) => s + (g.valor || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {};
    for (const [key, value] of fd.entries()) {
      if (value !== "") {
        data[key] = key === "valor" ? parseFloat(value) : value;
      }
    }
    createMutation.mutate(data);
  };

  return (
    <div>
      <PageHeader title="Gastos" subtitle={`Total: ${formatCurrency(totalFiltered)}`}>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(CATEGORIA_GASTOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4" /> Nuevo Gasto</Button>
      </PageHeader>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={DollarSign} title="Sin gastos" description="Registra tu primer gasto" actionLabel="Nuevo Gasto" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-2">
          {filtered.map(g => (
            <Card key={g.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">{g.descripcion || CATEGORIA_GASTOS[g.categoria] || g.categoria}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(g.fecha), "dd MMM yyyy", { locale: es })}
                      {g.tipo_gasto && ` • ${g.tipo_gasto}`}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-lg">{formatCurrency(g.valor)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open && isNew) navigate("/gastos"); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Nuevo Gasto</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Fecha *</Label>
              <Input name="fecha" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
            <div>
              <Label>Valor *</Label>
              <Input name="valor" type="number" required placeholder="Ej: 50000" className="text-lg h-12" />
            </div>
            <div>
              <Label>Categoría *</Label>
              <Select name="categoria" required defaultValue="">
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIA_GASTOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripción</Label>
              <Input name="descripcion" placeholder="Detalle del gasto" />
            </div>
            <div>
              <Label>Tipo de asignación</Label>
              <Select name="tipo_gasto" defaultValue="general">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="finca">Por finca</SelectItem>
                  <SelectItem value="lote">Por lote</SelectItem>
                  <SelectItem value="individual">Individual (animal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Finca</Label>
              <Select name="finca_id">
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {fincas.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lote</Label>
              <Select name="lote_id">
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {lotes.map(l => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Animal</Label>
              <Select name="animal_id" defaultValue={preAnimal || ""}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {animals.filter(a => a.estado === "activo").map(a => (
                    <SelectItem key={a.id} value={a.id}>#{a.numero}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea name="observaciones" />
            </div>
            <Button type="submit" className="w-full h-12" disabled={createMutation.isPending}>
              Guardar Gasto
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}