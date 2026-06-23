import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import { METODO_CONFIRMACION } from "@/lib/caballos";
import { getTerminologia, calcFechaProbablePartoEspecie } from "@/lib/reproduccion";
import { toast } from "sonner";

export default function ConfirmacionPreñezForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const yeguaIdParam = searchParams.get("yegua_id");

  const especie = searchParams.get("especie") || "equino";
  const T = getTerminologia(especie);
  const esEquino = especie === "equino";

  const { data: yeguas = [] } = useQuery({
    queryKey: ["yeguas"],
    queryFn: () => base44.entities.Yegua.list(),
    enabled: esEquino,
  });

  const { data: animales = [] } = useQuery({
    queryKey: ["animals"],
    queryFn: () => base44.entities.Animal.list(),
    enabled: !esEquino,
  });

  const hembrasEspecie = esEquino ? [] : animales.filter(a =>
    a.especie === especie && a.estado === "activo" && (a.sexo === "hembra" || !a.sexo)
  );
  const hembras = esEquino ? yeguas : hembrasEspecie;

  const { data: inseminaciones = [] } = useQuery({
    queryKey: ["inseminaciones"],
    queryFn: () => base44.entities.Inseminacion.list(),
  });

  const [formData, setFormData] = useState({
    yegua_id: yeguaIdParam || "",
    fecha: new Date().toISOString().split("T")[0],
    metodo: "palpacion",
    inseminacion_id: "",
    fecha_inseminacion: "",
    fecha_probable_parto: "",
    veterinario: "",
    observaciones: "",
  });

  const inseminacionesHembra = inseminaciones
    .filter(i => i.yegua_id === formData.yegua_id)
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

  // Auto-calculo fecha probable de parto SEGUN ESPECIE
  useEffect(() => {
    if (formData.fecha_inseminacion) {
      const fpp = calcFechaProbablePartoEspecie(formData.fecha_inseminacion, especie);
      setFormData(prev => ({ ...prev, fecha_probable_parto: fpp }));
    }
  }, [formData.fecha_inseminacion, especie]);

  // Autoseleccionar última inseminación
  useEffect(() => {
    if (formData.yegua_id && !formData.inseminacion_id && inseminacionesHembra.length > 0) {
      const ultima = inseminacionesHembra[0];
      setFormData(prev => ({
        ...prev,
        inseminacion_id: ultima.id,
        fecha_inseminacion: ultima.fecha,
      }));
    }
  }, [formData.yegua_id]); // eslint-disable-line

  const handleInseminacionChange = (insemId) => {
    const insem = inseminaciones.find(i => i.id === insemId);
    setFormData(prev => ({
      ...prev,
      inseminacion_id: insemId,
      fecha_inseminacion: insem?.fecha || "",
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const confirmacion = await base44.entities.ConfirmacionPreñez.create(data);

      if (esEquino) {
        const updateData = {
          estado_reproductivo: "preñada",
          fecha_confirmacion_preñez: data.fecha,
          fecha_probable_parto: data.fecha_probable_parto,
        };
        await base44.entities.Yegua.update(data.yegua_id, updateData);
      } else {
        // Bovinos/Ovinos: actualizamos observaciones del animal
        await base44.entities.Animal.update(data.yegua_id, {
          observaciones: (animales.find(a => a.id === data.yegua_id)?.observaciones || "") +
            `\nPreñez confirmada el ${data.fecha}. Parto probable: ${data.fecha_probable_parto || "—"}`,
        }).catch(() => {});
      }

      // Actualizar resultado de la inseminación a "preñada"
      if (data.inseminacion_id) {
        await base44.entities.Inseminacion.update(data.inseminacion_id, { resultado: "preñada" });
      }

      return confirmacion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yeguas"] });
      queryClient.invalidateQueries({ queryKey: ["confirmaciones"] });
      queryClient.invalidateQueries({ queryKey: ["inseminaciones"] });
      queryClient.invalidateQueries({ queryKey: ["animals"] });
      toast.success(T.prenezExito);
      navigate(yeguaIdParam ? (esEquino ? `/caballos/yeguas/${yeguaIdParam}` : `/animales/${yeguaIdParam}`) : "/reproduccion");
    },
    onError: (error) => {
      toast.error("Error: " + (error.message || "intente nuevamente"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.yegua_id) {
      toast.error(T.toastHembra);
      return;
    }
    if (!formData.fecha) {
      toast.error("La fecha de confirmación es obligatoria");
      return;
    }
    if (!formData.fecha_inseminacion) {
      toast.error("La fecha de inseminación / servicio relacionada es obligatoria");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={T.prenezTitulo} subtitle={T.prenezSubtitulo}>
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <Card className="p-6 space-y-4">
          <div>
            <Label>{T.hembra} *</Label>
            <Select
              value={formData.yegua_id}
              onValueChange={(v) => setFormData({
                ...formData,
                yegua_id: v,
                inseminacion_id: "",
                fecha_inseminacion: "",
              })}
              disabled={Boolean(yeguaIdParam)}
            >
              <SelectTrigger>
                <SelectValue placeholder={T.hembraPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {hembras.map(h => (
                  <SelectItem key={h.id} value={h.id}>{h.nombre || h.numero}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha">Fecha de confirmación *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Método de confirmación</Label>
              <Select
                value={formData.metodo}
                onValueChange={(v) => setFormData({ ...formData, metodo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METODO_CONFIRMACION).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.yegua_id && inseminacionesHembra.length > 0 && (
            <div>
              <Label>{esEquino ? "Inseminación" : "Servicio / inseminación"} relacionada *</Label>
              <Select
                value={formData.inseminacion_id}
                onValueChange={handleInseminacionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={esEquino ? "Seleccionar inseminación" : "Seleccionar servicio"} />
                </SelectTrigger>
                <SelectContent>
                  {inseminacionesHembra.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.fecha} - {i.reproductor || "Sin reproductor"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.yegua_id && inseminacionesHembra.length === 0 && (
            <div>
              <Label htmlFor="fecha_insem">Fecha de {esEquino ? "inseminación" : "servicio / inseminación"} relacionada *</Label>
              <Input
                id="fecha_insem"
                type="date"
                value={formData.fecha_inseminacion}
                onChange={(e) => setFormData({ ...formData, fecha_inseminacion: e.target.value })}
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="fpp">Fecha probable de parto</Label>
            <Input
              id="fpp"
              type="date"
              value={formData.fecha_probable_parto}
              onChange={(e) => setFormData({ ...formData, fecha_probable_parto: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Calculada automáticamente: {T.gestacionTexto}. Puedes editarla manualmente.
            </p>
          </div>

          <div>
            <Label htmlFor="veterinario">Veterinario o responsable</Label>
            <Input
              id="veterinario"
              value={formData.veterinario}
              onChange={(e) => setFormData({ ...formData, veterinario: e.target.value })}
              placeholder="Ej: Dr. González"
            />
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
            {saveMutation.isPending ? "Guardando..." : "Confirmar preñez"}
          </Button>
        </div>
      </form>
    </div>
  );
}