import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { formatCurrency, formatWeight } from "@/lib/helpers";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Ventas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const isNew = window.location.pathname.includes("/nueva");
  const preAnimal = urlParams.get("animal");

  const [dialogOpen, setDialogOpen] = useState(isNew);
  const [pesoVenta, setPesoVenta] = useState("");
  const [precioKilo, setPrecioKilo] = useState("");

  const { data: ventas = [], isLoading } = useQuery({ queryKey: ["ventas"], queryFn: () => base44.entities.Venta.list("-fecha", 200) });
  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });

  const precioTotal = pesoVenta && precioKilo ? parseFloat(pesoVenta) * parseFloat(precioKilo) : 0;

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const venta = await base44.entities.Venta.create(data);
      // Mark animal as sold
      if (data.animal_id) {
        await base44.entities.Animal.update(data.animal_id, { estado: "vendido" });
      }
      return venta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
      queryClient.invalidateQueries({ queryKey: ["animals"] });
      setDialogOpen(false);
      if (isNew) navigate("/ventas");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {};
    for (const [key, value] of fd.entries()) {
      if (value !== "") {
        if (["peso_venta", "precio_kilo", "precio_total", "costo_transporte", "comision", "otros_descuentos"].includes(key)) {
          data[key] = parseFloat(value);
        } else {
          data[key] = value;
        }
      }
    }
    // Auto-calculate total
    if (data.peso_venta && data.precio_kilo && !data.precio_total) {
      data.precio_total = data.peso_venta * data.precio_kilo;
    }
    // Set finca/lote from animal
    const animal = animals.find(a => a.id === data.animal_id);
    if (animal) {
      data.finca_id = animal.finca_id;
      data.lote_id = animal.lote_id;
    }
    createMutation.mutate(data);
  };

  const totalVentas = ventas.reduce((s, v) => s + (v.precio_total || 0), 0);
  const animalMap = {};
  animals.forEach(a => { animalMap[a.id] = a; });

  return (
    <div>
      <PageHeader title="Ventas" subtitle={`Total: ${formatCurrency(totalVentas)}`}>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4" /> Nueva Venta</Button>
      </PageHeader>

      {ventas.length === 0 && !isLoading ? (
        <EmptyState icon={ShoppingCart} title="Sin ventas" description="Registra tu primera venta" actionLabel="Nueva Venta" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-2">
          {ventas.map(v => {
            const animal = animalMap[v.animal_id];
            return (
              <Card key={v.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <Link to={`/animales/${v.animal_id}`} className="font-medium hover:underline">
                        #{animal?.numero || "—"}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(v.fecha), "dd MMM yyyy", { locale: es })}
                        {v.peso_venta && ` • ${formatWeight(v.peso_venta)}`}
                        {v.comprador && ` • ${v.comprador}`}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-lg">{formatCurrency(v.precio_total)}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open && isNew) navigate("/ventas"); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Nueva Venta</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Animal *</Label>
              <Select name="animal_id" defaultValue={preAnimal || ""} required>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {animals.filter(a => a.estado === "activo").map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      #{a.numero} {a.ultimo_peso ? `- ${a.ultimo_peso} kg` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha *</Label>
              <Input name="fecha" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Peso al vender (kg)</Label>
                <Input name="peso_venta" type="number" step="0.1" value={pesoVenta} onChange={(e) => setPesoVenta(e.target.value)} placeholder="Ej: 450" />
              </div>
              <div>
                <Label>Precio por kilo</Label>
                <Input name="precio_kilo" type="number" value={precioKilo} onChange={(e) => setPrecioKilo(e.target.value)} placeholder="Ej: 7500" />
              </div>
            </div>
            {precioTotal > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <p className="text-sm text-emerald-700">Precio total calculado</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(precioTotal)}</p>
              </div>
            )}
            <div>
              <Label>Precio total de venta</Label>
              <Input name="precio_total" type="number" defaultValue="" placeholder={precioTotal > 0 ? precioTotal.toString() : "Ej: 3375000"} />
            </div>
            <div>
              <Label>Comprador</Label>
              <Input name="comprador" placeholder="Nombre" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Transporte</Label>
                <Input name="costo_transporte" type="number" placeholder="0" />
              </div>
              <div>
                <Label>Comisión</Label>
                <Input name="comision" type="number" placeholder="0" />
              </div>
              <div>
                <Label>Otros</Label>
                <Input name="otros_descuentos" type="number" placeholder="0" />
              </div>
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea name="observaciones" />
            </div>
            <Button type="submit" className="w-full h-12" disabled={createMutation.isPending}>
              Registrar Venta
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}