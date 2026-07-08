import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import MoneyInput from "@/components/shared/MoneyInput";
import GastoDistribucion from "@/components/gastos/GastoDistribucion";
import { CATEGORIA_GASTOS, parseMoney } from "@/lib/helpers";
import { getDistribucionDefault, distribuirPorAnimal, distribuirPorPeso, validarDistribucionManual, buildDistribucionJson } from "@/lib/distribucionGastos";
import { useToast } from "@/components/ui/use-toast";

const ESPECIE_DEFAULT = "general";

export default function GastoDialog({ isOpen, onOpenChange, preAnimal, fincas = [], lotes = [], animals = [], user }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    valor: "",
    especie: ESPECIE_DEFAULT,
    categoria: "",
    descripcion: "",
    tipo_gasto: "general",
    finca_id: "",
    lote_id: "",
    animal_id: preAnimal || "",
    observaciones: "",
  });
  const [metodoDistribucion, setMetodoDistribucion] = useState(() => getDistribucionDefault(user));
  const [manualDistribucion, setManualDistribucion] = useState({});

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Gasto.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
      resetForm();
      onOpenChange(false);
      toast({ title: "Gasto registrado", description: "El gasto se guardó correctamente." });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: err?.message || "No se pudo guardar el gasto." });
    },
  });

  const resetForm = () => {
    setForm({
      fecha: new Date().toISOString().split("T")[0],
      valor: "",
      especie: ESPECIE_DEFAULT,
      categoria: "",
      descripcion: "",
      tipo_gasto: "general",
      finca_id: "",
      lote_id: "",
      animal_id: preAnimal || "",
      observaciones: "",
    });
    setMetodoDistribucion(getDistribucionDefault(user));
    setManualDistribucion({});
  };

  const valorNum = parseMoney(form.valor);
  const isIndividual = !!form.animal_id;

  // Animales entre los que se puede distribuir (según lote/finca/especie).
  const animalesDistribuir = useMemo(() => {
    if (isIndividual || valorNum <= 0) return [];
    let base = animals.filter((a) => a.estado === "activo");
    if (form.lote_id) base = base.filter((a) => a.lote_id === form.lote_id);
    else if (form.finca_id) base = base.filter((a) => a.finca_id === form.finca_id);
    if (form.especie && form.especie !== "general") base = base.filter((a) => (a.especie || "bovino") === form.especie);
    return base;
  }, [animals, form.lote_id, form.finca_id, form.especie, isIndividual, valorNum]);

  const showDistribucion = !isIndividual && animalesDistribuir.length > 0 && valorNum > 0;

  const sinPeso = useMemo(() => animalesDistribuir.filter((a) => !a.ultimo_peso || a.ultimo_peso <= 0).length, [animalesDistribuir]);

  const distribucion = useMemo(() => {
    if (!showDistribucion || metodoDistribucion === "no_distribuir") return [];
    if (metodoDistribucion === "por_animal") return distribuirPorAnimal(valorNum, animalesDistribuir);
    if (metodoDistribucion === "por_peso") return distribuirPorPeso(valorNum, animalesDistribuir);
    if (metodoDistribucion === "manual") {
      return animalesDistribuir.map((a) => ({
        animal_id: a.id,
        numero: a.numero,
        nombre: a.nombre,
        peso: a.ultimo_peso,
        monto: parseMoney(manualDistribucion[a.id] || "0"),
      }));
    }
    return [];
  }, [showDistribucion, metodoDistribucion, valorNum, animalesDistribuir, manualDistribucion]);

  const validacion = useMemo(() => {
    if (metodoDistribucion !== "manual") return { valid: true };
    return validarDistribucionManual(distribucion, valorNum);
  }, [metodoDistribucion, distribucion, valorNum]);

  const lotesFiltrados = useMemo(() => {
    if (!form.finca_id) return lotes;
    return lotes.filter((l) => l.finca_id === form.finca_id);
  }, [lotes, form.finca_id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fecha || !form.categoria || valorNum <= 0) return;
    if (showDistribucion && metodoDistribucion === "manual" && !validacion.valid) return;

    const data = {
      fecha: form.fecha,
      valor: valorNum,
      especie: form.especie,
      categoria: form.categoria,
      descripcion: form.descripcion || undefined,
      tipo_gasto: form.tipo_gasto,
      finca_id: form.finca_id || undefined,
      lote_id: form.lote_id || undefined,
      animal_id: form.animal_id || undefined,
      observaciones: form.observaciones || undefined,
      metodo_distribucion: showDistribucion ? metodoDistribucion : "no_distribuir",
      distribucion_json: showDistribucion && metodoDistribucion === "manual" ? buildDistribucionJson(distribucion) : undefined,
    };
    createMutation.mutate(data);
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">Nuevo Gasto</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Fecha *</Label>
            <Input type="date" value={form.fecha} onChange={(e) => setField("fecha", e.target.value)} required />
          </div>
          <div>
            <Label>Valor *</Label>
            <MoneyInput value={form.valor} onChange={(v) => setField("valor", v)} placeholder="Ej: 50000" className="text-lg h-12" required />
          </div>
          <div>
            <Label>Especie / Línea</Label>
            <Select value={form.especie} onValueChange={(v) => setField("especie", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General finca</SelectItem>
                <SelectItem value="bovino">🐄 Bovino</SelectItem>
                <SelectItem value="ovino">🐑 Ovino</SelectItem>
                <SelectItem value="equino">🐴 Equino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Categoría *</Label>
            <Select value={form.categoria} onValueChange={(v) => setField("categoria", v)} required>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIA_GASTOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descripción</Label>
            <Input value={form.descripcion} onChange={(e) => setField("descripcion", e.target.value)} placeholder="Detalle del gasto" />
          </div>
          <div>
            <Label>Tipo de asignación</Label>
            <Select value={form.tipo_gasto} onValueChange={(v) => setField("tipo_gasto", v)}>
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
            <Select value={form.finca_id} onValueChange={(v) => { setField("finca_id", v); setField("lote_id", ""); }}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {fincas.map((f) => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Lote / Potrero</Label>
            <Select value={form.lote_id} onValueChange={(v) => setField("lote_id", v)}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {lotesFiltrados.map((l) => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Animal</Label>
            <Select value={form.animal_id} onValueChange={(v) => setField("animal_id", v)}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {animals.filter((a) => a.estado === "activo").map((a) => (
                  <SelectItem key={a.id} value={a.id}>#{a.numero} {a.nombre ? `(${a.nombre})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showDistribucion && (
            <GastoDistribucion
              metodo={metodoDistribucion}
              onMetodoChange={setMetodoDistribucion}
              valor={valorNum}
              animales={animalesDistribuir}
              manual={manualDistribucion}
              onManualChange={setManualDistribucion}
              distribucion={distribucion}
              validacion={validacion}
              sinPeso={sinPeso}
            />
          )}

          <div>
            <Label>Observaciones</Label>
            <Textarea value={form.observaciones} onChange={(e) => setField("observaciones", e.target.value)} />
          </div>
          <Button
            type="submit"
            className="w-full h-12"
            disabled={createMutation.isPending || (showDistribucion && metodoDistribucion === "manual" && !validacion.valid)}
          >
            Guardar Gasto
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}