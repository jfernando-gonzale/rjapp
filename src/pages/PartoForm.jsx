import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Save, Baby } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import { RESULTADO_PARTO, SEXO_CRIA } from "@/lib/caballos";
import { toast } from "sonner";

export default function PartoForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const yeguaIdParam = searchParams.get("yegua_id");

  const { data: yeguas = [] } = useQuery({
    queryKey: ["yeguas"],
    queryFn: () => base44.entities.Yegua.list(),
  });

  const { data: fincas = [] } = useQuery({
    queryKey: ["fincas"],
    queryFn: () => base44.entities.Finca.list(),
  });

  const [formData, setFormData] = useState({
    yegua_id: yeguaIdParam || "",
    fecha: new Date().toISOString().split("T")[0],
    resultado: "cria_viva",
    sexo_cria: "no_registrado",
    nombre_cria: "",
    color_cria: "",
    observaciones: "",
  });

  const yeguaSeleccionada = yeguas.find(y => y.id === formData.yegua_id);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Crear el registro del parto
      const parto = await base44.entities.Parto.create(data);

      let criaId = null;

      // Si el resultado es cría viva, crear automáticamente el registro de la cría
      if (data.resultado === "cria_viva") {
        const yegua = yeguas.find(y => y.id === data.yegua_id);
        const cria = await base44.entities.Cria.create({
          nombre: data.nombre_cria || "",
          madre_id: data.yegua_id,
          finca_id: yegua?.finca_id || "",
          fecha_nacimiento: data.fecha,
          sexo: data.sexo_cria,
          color: data.color_cria || "",
          estado: "lactante",
          parto_id: parto.id,
        });
        criaId = cria.id;

        // Actualizar el parto con el ID de la cría
        await base44.entities.Parto.update(parto.id, { cria_id: criaId });
      }

      // Actualizar la yegua a "parida"
      const updateData = {
        estado_reproductivo: "parida",
        fecha_ultimo_parto: data.fecha,
        fecha_probable_parto: null,
        fecha_confirmacion_preñez: null,
        fecha_ultima_inseminacion: null,
        repeticiones_celo: 0,
      };
      if (criaId) {
        updateData.cria_actual_id = criaId;
      }
      await base44.entities.Yegua.update(data.yegua_id, updateData);

      return parto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yeguas"] });
      queryClient.invalidateQueries({ queryKey: ["partos"] });
      queryClient.invalidateQueries({ queryKey: ["crias"] });
      toast.success("Parto registrado. Estado actualizado a 'Parida'.");
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
      toast.error("La fecha del parto es obligatoria");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Registrar Parto" subtitle="Registra el parto de una yegua">
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
              <Label htmlFor="fecha">Fecha del parto *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Resultado del parto *</Label>
              <Select
                value={formData.resultado}
                onValueChange={(v) => setFormData({ ...formData, resultado: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESULTADO_PARTO).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Datos de la cría - solo si es cría viva */}
          {formData.resultado === "cria_viva" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Datos de la cría (se creará automáticamente)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Sexo de la cría</Label>
                  <Select
                    value={formData.sexo_cria}
                    onValueChange={(v) => setFormData({ ...formData, sexo_cria: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SEXO_CRIA).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nombre_cria">Nombre o número de la cría</Label>
                  <Input
                    id="nombre_cria"
                    value={formData.nombre_cria}
                    onChange={(e) => setFormData({ ...formData, nombre_cria: e.target.value })}
                    placeholder="Ej: Potranca 01"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="color_cria">Color de la cría</Label>
                <Input
                  id="color_cria"
                  value={formData.color_cria}
                  onChange={(e) => setFormData({ ...formData, color_cria: e.target.value })}
                  placeholder="Ej: Alazán"
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas del parto..."
              className="resize-none"
              rows={3}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Guardando..." : "Registrar parto"}
          </Button>
        </div>
      </form>
    </div>
  );
}