import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Save, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import { TIPO_INSEMINACION, RESULTADO_INSEMINACION } from "@/lib/caballos";
import { toast } from "sonner";

export default function InseminacionForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const yeguaIdParam = searchParams.get("yegua_id");

  const { data: yeguas = [] } = useQuery({
    queryKey: ["yeguas"],
    queryFn: () => base44.entities.Yegua.list(),
  });

  const [formData, setFormData] = useState({
    yegua_id: yeguaIdParam || "",
    fecha: new Date().toISOString().split("T")[0],
    tipo: "monta_natural",
    reproductor: "",
    responsable: "",
    resultado: "pendiente",
    observaciones: "",
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Crear la inseminación
      const inseminacion = await base44.entities.Inseminacion.create(data);

      // Actualizar estado de la yegua a "inseminada" y guardar fecha de última inseminación
      await base44.entities.Yegua.update(data.yegua_id, {
        estado_reproductivo: "inseminada",
        fecha_ultima_inseminacion: data.fecha,
        repeticiones_celo: 0,
      });

      return inseminacion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yeguas"] });
      queryClient.invalidateQueries({ queryKey: ["inseminaciones"] });
      toast.success("Inseminación registrada. Estado de la yegua actualizado a 'Inseminada'.");
      navigate(yeguaIdParam ? `/caballos/yeguas/${yeguaIdParam}` : "/caballos");
    },
    onError: (error) => {
      toast.error("Error: " + (error.message || "intente nuevamente"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.yegua_id) {
      toast.error("Selecciona una yegua");
      return;
    }
    if (!formData.fecha) {
      toast.error("La fecha es obligatoria");
      return;
    }
    const dataToSave = { ...formData };
    if (!dataToSave.reproductor) delete dataToSave.reproductor;
    if (!dataToSave.responsable) delete dataToSave.responsable;
    saveMutation.mutate(dataToSave);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Nueva Inseminación / Monta" subtitle="Registra la inseminación o monta de una yegua">
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <Card className="p-6 space-y-4">
          <div>
            <Label>Yegua *</Label>
            <Select
              value={formData.yegua_id}
              onValueChange={(v) => setFormData({ ...formData, yegua_id: v })}
              disabled={Boolean(yeguaIdParam)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar yegua" />
              </SelectTrigger>
              <SelectContent>
                {yeguas.map(y => (
                  <SelectItem key={y.id} value={y.id}>{y.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(v) => setFormData({ ...formData, tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_INSEMINACION).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reproductor">Reproductor / Caballo / Semen</Label>
              <Input
                id="reproductor"
                value={formData.reproductor}
                onChange={(e) => setFormData({ ...formData, reproductor: e.target.value })}
                placeholder="Ej: Caballo 'Relámpago'"
              />
            </div>
            <div>
              <Label htmlFor="responsable">Responsable</Label>
              <Input
                id="responsable"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                placeholder="Ej: Carlos Pérez"
              />
            </div>
          </div>

          <div>
            <Label>Resultado</Label>
            <Select
              value={formData.resultado}
              onValueChange={(v) => setFormData({ ...formData, resultado: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RESULTADO_INSEMINACION).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">El estado de la yegua cambiará a "Inseminada" automáticamente</p>
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas..."
              className="resize-none"
              rows={3}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Guardando..." : "Registrar"}
          </Button>
        </div>
      </form>
    </div>
  );
}