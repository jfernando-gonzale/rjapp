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
import { Syringe, Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatCurrency, TIPO_TRATAMIENTO } from "@/lib/helpers";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ESPECIE_COLORS = {
  bovino: "bg-amber-100 text-amber-800",
  ovino: "bg-green-100 text-green-800",
  equino: "bg-blue-100 text-blue-800",
};
const ESPECIE_LABELS = { bovino: "🐄 Bovino", ovino: "🐑 Ovino", equino: "🐴 Equino" };

export default function Tratamientos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const isNew = window.location.pathname.includes("/nuevo");
  const preAnimal = urlParams.get("animal");

  const [dialogOpen, setDialogOpen] = useState(isNew);
  const [tipoRegistro, setTipoRegistro] = useState("individual");
  const [formEspecie, setFormEspecie] = useState("bovino");
  const [filterEspecie, setFilterEspecie] = useState("all");

  const { data: tratamientos = [], isLoading } = useQuery({ queryKey: ["tratamientos"], queryFn: () => base44.entities.Tratamiento.list("-fecha", 200) });
  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tratamiento.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tratamientos"] }); setDialogOpen(false); if (isNew) navigate("/tratamientos"); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = { tipo_registro: tipoRegistro, especie: formEspecie };
    for (const [key, value] of fd.entries()) {
      if (value !== "") {
        if (["costo", "numero_animales"].includes(key)) data[key] = parseFloat(value);
        else data[key] = value;
      }
    }
    createMutation.mutate(data);
  };

  const animalMap = {};
  animals.forEach(a => { animalMap[a.id] = a; });

  // Animales y lotes filtrados por especie del formulario
  const animalesForm = animals.filter(a => a.estado === "activo" && (a.especie || "bovino") === formEspecie);
  const lotesForm = lotes.filter(l => !l.especie || l.especie === formEspecie || l.especie === "mixto");

  const today = new Date().toISOString().split("T")[0];
  const upcoming = tratamientos.filter(t => t.proxima_fecha && t.proxima_fecha >= today);

  // Filtrar lista
  const filtered = useMemo(() => tratamientos.filter(t => {
    if (filterEspecie !== "all") {
      // Filtrar por especie del tratamiento, o especie del animal asociado
      const especieTrat = t.especie;
      const animalEspecie = animalMap[t.animal_id]?.especie || "bovino";
      const especie = especieTrat || animalEspecie;
      if (especie !== filterEspecie) return false;
    }
    return true;
  }), [tratamientos, filterEspecie, animalMap]);

  return (
    <div>
      <PageHeader title="Tratamientos" subtitle={`${filtered.length} registros`}>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4" /> Nuevo</Button>
      </PageHeader>

      {/* Filtro especie */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          { key: "all", label: "Todas las especies" },
          { key: "bovino", label: "🐄 Bovinos" },
          { key: "ovino", label: "🐑 Ovinos" },
          { key: "equino", label: "🐴 Equinos" },
        ].map(e => (
          <button key={e.key} onClick={() => setFilterEspecie(e.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filterEspecie === e.key ? "bg-amber-500 text-black border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
            }`}>{e.label}</button>
        ))}
      </div>

      {/* Próximos tratamientos */}
      {upcoming.length > 0 && (
        <div className="mb-4 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Próximos tratamientos</h3>
          {upcoming.slice(0, 3).map(t => (
            <Card key={t.id} className="p-3 border-l-4 border-l-amber-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{TIPO_TRATAMIENTO[t.tipo] || t.tipo} - {t.producto || ""}</p>
                  <p className="text-xs text-muted-foreground">
                    Programado: {format(new Date(t.proxima_fecha), "dd MMM yyyy", { locale: es })}
                  </p>
                </div>
                <StatusBadge status="pendiente" label="Pendiente" color="yellow" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={Syringe} title="Sin tratamientos" description="Registra el primer tratamiento" actionLabel="Nuevo" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-2">
          {filtered.map(t => {
            const animal = animalMap[t.animal_id];
            const especie = t.especie || animal?.especie || "bovino";
            return (
              <Card key={t.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Syringe className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{TIPO_TRATAMIENTO[t.tipo] || t.tipo}</p>
                        {t.producto && <span className="text-sm text-muted-foreground">({t.producto})</span>}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${ESPECIE_COLORS[especie] || "bg-gray-100 text-gray-600"}`}>
                          {ESPECIE_LABELS[especie] || especie}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t.fecha ? format(new Date(t.fecha), "dd MMM yyyy", { locale: es }) : ""}
                        {t.tipo_registro === "individual" && animal ? ` • #${animal.numero}` : ""}
                        {t.tipo_registro === "lote" && t.numero_animales ? ` • ${t.numero_animales} animales` : ""}
                      </p>
                    </div>
                  </div>
                  {t.costo > 0 && <p className="font-bold">{formatCurrency(t.costo)}</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open && isNew) navigate("/tratamientos"); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Nuevo Tratamiento</DialogTitle></DialogHeader>

          {/* Seleccionar especie primero */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Especie</Label>
            <div className="flex gap-2 mb-2">
              {[
                { key: "bovino", label: "🐄 Bovino" },
                { key: "ovino", label: "🐑 Ovino" },
                { key: "equino", label: "🐴 Equino" },
              ].map(e => (
                <button key={e.key} type="button" onClick={() => setFormEspecie(e.key)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    formEspecie === e.key ? "bg-amber-500 text-black border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
                  }`}>{e.label}</button>
              ))}
            </div>
          </div>

          {/* Individual / Lote */}
          <div className="flex gap-2 mb-2">
            <Button size="sm" variant={tipoRegistro === "individual" ? "default" : "outline"} onClick={() => setTipoRegistro("individual")}>Individual</Button>
            <Button size="sm" variant={tipoRegistro === "lote" ? "default" : "outline"} onClick={() => setTipoRegistro("lote")}>Por lote</Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Fecha *</Label>
              <Input name="fecha" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select name="tipo" required>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_TRATAMIENTO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {tipoRegistro === "individual" ? (
              <div>
                <Label>Animal * <span className="text-xs text-amber-600">({animalesForm.length} {ESPECIE_LABELS[formEspecie]})</span></Label>
                <Select name="animal_id" defaultValue={preAnimal || ""} required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {animalesForm.map(a => (
                      <SelectItem key={a.id} value={a.id}>#{a.numero} {a.nombre ? `(${a.nombre})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div>
                  <Label>Finca</Label>
                  <Select name="finca_id">
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {fincas.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lote <span className="text-xs text-amber-600">(filtrado por especie)</span></Label>
                  <Select name="lote_id">
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {lotesForm.map(l => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>N° de animales tratados</Label>
                  <Input name="numero_animales" type="number" />
                </div>
              </>
            )}

            <div>
              <Label>Producto</Label>
              <Input name="producto" placeholder="Nombre del producto" />
            </div>
            <div>
              <Label>Dosis</Label>
              <Input name="dosis" placeholder="Ej: 5ml" />
            </div>
            <div>
              <Label>Costo</Label>
              <Input name="costo" type="number" placeholder="0" />
            </div>
            <div>
              <Label>Próxima fecha recomendada</Label>
              <Input name="proxima_fecha" type="date" />
            </div>
            <div>
              <Label>Responsable</Label>
              <Input name="responsable" />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea name="observaciones" />
            </div>
            <Button type="submit" className="w-full h-12" disabled={createMutation.isPending}>
              Guardar Tratamiento
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}