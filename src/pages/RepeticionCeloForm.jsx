import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Save, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import { NUEVA_ACCION_CELO } from "@/lib/caballos";
import { toast } from "sonner";

export default function RepeticionCeloForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const yeguaIdParam = searchParams.get("yegua_id");

  const { data: yeguas = [] } = useQuery({
    queryKey: ["yeguas"],
    queryFn: () => base44.entities.Yegua.list(),
  });

  const { data: inseminaciones = [] } = useQuery({
    queryKey: ["inseminaciones"],
    queryFn: () => base44.entities.Inseminacion.list(),
  });

  const [formData, setFormData] = useState({
    yegua_id: yeguaIdParam || "",
    fecha: new Date().toISOString().split("T")[0],
    inseminacion_id: "",
    fecha_inseminacion_anterior: "",
    nueva_accion: "observacion",
    observaciones: "",
  });

  const yeguaSeleccionada = yeguas.find(y => y.id === formData.yegua_id);
  const inseminacionesYegua = inseminaciones
    .filter(i => i.yegua_id === formData.yegua_id)
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

  const handleInseminacionChange = (insemId) => {
    const insem = inseminaciones.find(i => i.id === insemId);
    setFormData(prev => ({
      ...prev,
      inseminacion_id: insemId,
      fecha_inseminacion_anterior: insem?.fecha || "",
    }));
  };

  // Autoseleccionar última inseminación
  useEffect(() => {
    if (formData.yegua_id && !formData.inseminacion_id && inseminacionesYegua.length > 0) {
      const ultima = inseminacionesYegua[0];
      setFormData(prev => ({
        ...prev,
        inseminacion_id: ultima.id,
        fecha_inseminacion_anterior: ultima.fecha,
      }));
    }
  }, [formData.yegua_id]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Crear el registro de repetición
      const repeticion = await base44.entities.RepeticionCelo.create(data);

      // Actualizar la yegua: cambiar estado a "vacia" e incrementar contador
      const yegua = yeguas.find(y => y.id === data.yegua_id);
      const nuevasRepeticiones = (yegua?.repeticiones_celo || 0) + 1;
      await base44.entities.Yegua.update(data.yegua_id, {
        estado_reproductivo: "vacia",
        repeticiones_celo: nuevasRepeticiones,
        fecha_ultima_inseminacion: null,
        fecha_probable_parto: null,
        fecha_confirmacion_preñez: null,
      });

      // Actualizar resultado de la inseminación a "repitio_celo"
      if (data.inseminacion_id) {
        await base44.entities.Inseminacion.update(data.inseminacion_id, { resultado: "repitio_celo" });
      }

      return repeticion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yeguas"] });
      queryClient.invalidateQueries({ queryKey: ["repeticiones"] });
      queryClient.invalidateQueries({ queryKey: ["inseminaciones"] });
      toast.success("Repetición de celo registrada. Estado actualizado a 'Vacía'.");
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
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Repetición de Celo" subtitle="Registra que la yegua repitió celo">
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
              onValueChange={(v) => setFormData({
                ...formData,
                yegua_id: v,
                inseminacion_id: "",
                fecha_inseminacion_anterior: "",
              })}
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
            {yeguaSeleccionada?.repeticiones_celo > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                Esta yegua ya repitió celo {yeguaSeleccionada.repeticiones_celo} vez(ces) en este ciclo
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="fecha">Fecha en que repitió celo *</Label>
            <Input
              id="fecha"
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              required
            />
          </div>

          {formData.yegua_id && inseminacionesYegua.length > 0 && (
            <div>
              <Label>Inseminación anterior relacionada</Label>
              <Select
                value={formData.inseminacion_id}
                onValueChange={handleInseminacionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar inseminación" />
                </SelectTrigger>
                <SelectContent>
                  {inseminacionesYegua.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.fecha} - {i.reproductor || "Sin reproductor"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Nueva acción</Label>
            <Select
              value={formData.nueva_accion}
              onValueChange={(v) => setFormData({ ...formData, nueva_accion: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NUEVA_ACCION_CELO).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">El estado de la yegua cambiará a "Vacía" automáticamente</p>
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