import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { ESTADO_ANIMAL } from "@/lib/helpers";

export default function AnimalForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const queryClient = useQueryClient();
  const [moreDetails, setMoreDetails] = useState(false);

  const { data: animal } = useQuery({
    queryKey: ["animal", id],
    queryFn: () => base44.entities.Animal.filter({ id }),
    enabled: isEditing,
    select: (data) => data[0],
  });

  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Animal.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["animals"] }); navigate("/animales"); },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Animal.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["animals"] }); queryClient.invalidateQueries({ queryKey: ["animal", id] }); navigate(`/animales/${id}`); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {};
    for (const [key, value] of fd.entries()) {
      if (value !== "") {
        if (["peso_compra", "precio_compra", "precio_kilo_compra", "costo_transporte_inicial", "otros_costos_iniciales"].includes(key)) {
          data[key] = parseFloat(value);
        } else {
          data[key] = value;
        }
      }
    }
    // Set initial weight from purchase weight
    if (data.peso_compra && !isEditing) {
      data.ultimo_peso = data.peso_compra;
      data.fecha_ultimo_pesaje = data.fecha_compra || new Date().toISOString().split("T")[0];
    }
    if (isEditing) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const defaults = isEditing && animal ? animal : {};

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> Volver
      </Button>
      
      <h1 className="text-2xl font-heading font-bold mb-6">{isEditing ? "Editar Animal" : "Nuevo Animal"}</h1>

      <form onSubmit={handleSubmit}>
        <Card className="p-5 space-y-4 mb-4">
          <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">Datos básicos</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número / Chapeta *</Label>
              <Input name="numero" defaultValue={defaults.numero} required placeholder="Ej: 101" />
            </div>
            <div>
              <Label>Nombre (opcional)</Label>
              <Input name="nombre" defaultValue={defaults.nombre} placeholder="Ej: Manchas" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Finca *</Label>
              <Select name="finca_id" defaultValue={defaults.finca_id} required>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {fincas.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lote</Label>
              <Select name="lote_id" defaultValue={defaults.lote_id}>
                <SelectTrigger><SelectValue placeholder="Sin lote" /></SelectTrigger>
                <SelectContent>
                  {lotes.map(l => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Sexo</Label>
              <Select name="sexo" defaultValue={defaults.sexo}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="hembra">Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Raza</Label>
              <Input name="raza" defaultValue={defaults.raza} placeholder="Ej: Brahman" />
            </div>
            <div>
              <Label>Estado</Label>
              <Select name="estado" defaultValue={defaults.estado || "activo"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADO_ANIMAL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4 mb-4">
          <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">Datos de compra</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha de compra</Label>
              <Input name="fecha_compra" type="date" defaultValue={defaults.fecha_compra} />
            </div>
            <div>
              <Label>Peso al comprar (kg)</Label>
              <Input name="peso_compra" type="number" step="0.1" defaultValue={defaults.peso_compra} placeholder="Ej: 280" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Precio de compra total</Label>
              <Input name="precio_compra" type="number" defaultValue={defaults.precio_compra} placeholder="Ej: 1500000" />
            </div>
            <div>
              <Label>Precio por kilo</Label>
              <Input name="precio_kilo_compra" type="number" step="1" defaultValue={defaults.precio_kilo_compra} placeholder="Ej: 5000" />
            </div>
          </div>
        </Card>

        <Collapsible open={moreDetails} onOpenChange={setMoreDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full mb-4 gap-2">
              <ChevronDown className={`w-4 h-4 transition-transform ${moreDetails ? "rotate-180" : ""}`} />
              Más detalles
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="p-5 space-y-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Color</Label>
                  <Input name="color" defaultValue={defaults.color} placeholder="Ej: Negro con blanco" />
                </div>
                <div>
                  <Label>Marca del ganado</Label>
                  <Input name="marca" defaultValue={defaults.marca} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de nacimiento</Label>
                  <Input name="fecha_nacimiento" type="date" defaultValue={defaults.fecha_nacimiento} />
                </div>
                <div>
                  <Label>Edad aproximada</Label>
                  <Input name="edad_aproximada" defaultValue={defaults.edad_aproximada} placeholder="Ej: 2 años" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendedor</Label>
                  <Input name="vendedor" defaultValue={defaults.vendedor} />
                </div>
                <div>
                  <Label>Lugar de compra</Label>
                  <Input name="lugar_compra" defaultValue={defaults.lugar_compra} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Costo transporte</Label>
                  <Input name="costo_transporte_inicial" type="number" defaultValue={defaults.costo_transporte_inicial} />
                </div>
                <div>
                  <Label>Otros costos</Label>
                  <Input name="otros_costos_iniciales" type="number" defaultValue={defaults.otros_costos_iniciales} />
                </div>
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea name="observaciones" defaultValue={defaults.observaciones} />
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <Button type="submit" className="w-full h-12 text-base font-medium" disabled={createMutation.isPending || updateMutation.isPending}>
          {isEditing ? "Guardar cambios" : "Registrar Animal"}
        </Button>
      </form>
    </div>
  );
}