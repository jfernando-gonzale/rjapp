import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Weight, Check } from "lucide-react";
import { formatWeight, daysBetween, calcDailyGain } from "@/lib/helpers";
import GainIndicator from "@/components/shared/GainIndicator";

export default function PesajeForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const preAnimal = urlParams.get("animal");
  const preLote = urlParams.get("lote");

  const [mode, setMode] = useState(preLote ? "lote" : "individual");
  const [selectedEspecie, setSelectedEspecie] = useState("all");
  const [selectedFinca, setSelectedFinca] = useState("");
  const [selectedLote, setSelectedLote] = useState(preLote || "");
  const [selectedAnimal, setSelectedAnimal] = useState(preAnimal || "");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [peso, setPeso] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [batchWeights, setBatchWeights] = useState({});
  const [saved, setSaved] = useState(false);

  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });
  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });

  const filteredLotes = selectedFinca ? lotes.filter(l => l.finca_id === selectedFinca) : lotes;

  const filteredAnimals = useMemo(() => animals.filter(a => {
    if (a.estado !== "activo") return false;
    if (selectedEspecie !== "all" && (a.especie || "bovino") !== selectedEspecie) return false;
    if (mode === "lote" && selectedLote) return a.lote_id === selectedLote;
    if (selectedFinca) return a.finca_id === selectedFinca;
    return true;
  }), [animals, selectedEspecie, mode, selectedLote, selectedFinca]);

  const createPesajeMutation = useMutation({
    mutationFn: async (pesajeData) => {
      const pesaje = await base44.entities.Pesaje.create(pesajeData);
      await base44.entities.Animal.update(pesajeData.animal_id, {
        ultimo_peso: pesajeData.peso,
        fecha_ultimo_pesaje: pesajeData.fecha,
      });
      return pesaje;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pesajes"] });
      queryClient.invalidateQueries({ queryKey: ["animals"] });
    },
  });

  const handleIndividualSubmit = async (e) => {
    e.preventDefault();
    const animal = animals.find(a => a.id === selectedAnimal);
    const pesoNum = parseFloat(peso);
    const prevPeso = animal?.ultimo_peso || animal?.peso_compra;
    const prevFecha = animal?.fecha_ultimo_pesaje || animal?.fecha_compra;
    const dias = prevFecha ? daysBetween(prevFecha, fecha) : null;
    const ganancia = prevPeso && dias ? calcDailyGain(pesoNum, prevPeso, dias) : null;

    await createPesajeMutation.mutateAsync({
      animal_id: selectedAnimal,
      finca_id: animal?.finca_id || selectedFinca,
      lote_id: animal?.lote_id || selectedLote,
      fecha,
      peso: pesoNum,
      peso_anterior: prevPeso || null,
      diferencia_peso: prevPeso ? pesoNum - prevPeso : null,
      dias_entre_pesajes: dias,
      ganancia_diaria: ganancia,
      observaciones,
    });
    setSaved(true);
    setTimeout(() => navigate("/pesajes"), 1000);
  };

  const handleBatchSubmit = async () => {
    const entries = Object.entries(batchWeights).filter(([_, w]) => w && parseFloat(w) > 0);
    for (const [animalId, w] of entries) {
      const animal = animals.find(a => a.id === animalId);
      const pesoNum = parseFloat(w);
      const prevPeso = animal?.ultimo_peso || animal?.peso_compra;
      const prevFecha = animal?.fecha_ultimo_pesaje || animal?.fecha_compra;
      const dias = prevFecha ? daysBetween(prevFecha, fecha) : null;
      const ganancia = prevPeso && dias ? calcDailyGain(pesoNum, prevPeso, dias) : null;

      await createPesajeMutation.mutateAsync({
        animal_id: animalId,
        finca_id: animal?.finca_id,
        lote_id: animal?.lote_id,
        fecha,
        peso: pesoNum,
        peso_anterior: prevPeso || null,
        diferencia_peso: prevPeso ? pesoNum - prevPeso : null,
        dias_entre_pesajes: dias,
        ganancia_diaria: ganancia,
      });
    }
    setSaved(true);
    setTimeout(() => navigate("/pesajes"), 1000);
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <p className="font-heading font-bold text-lg">¡Pesaje guardado!</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> Volver
      </Button>

      <h1 className="text-2xl font-heading font-bold mb-2">Nuevo Pesaje</h1>

      {/* Modo */}
      <div className="flex gap-2 mb-4">
        <Button variant={mode === "individual" ? "default" : "outline"} onClick={() => setMode("individual")}>Individual</Button>
        <Button variant={mode === "lote" ? "default" : "outline"} onClick={() => setMode("lote")}>Por lote</Button>
      </div>

      {/* Filtro especie */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: "all", label: "Todas las especies" },
          { key: "bovino", label: "🐄 Bovinos" },
          { key: "ovino", label: "🐑 Ovinos" },
          { key: "equino", label: "🐴 Equinos" },
        ].map(e => (
          <button key={e.key} onClick={() => { setSelectedEspecie(e.key); setSelectedAnimal(""); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              selectedEspecie === e.key ? "bg-amber-500 text-black border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
            }`}>{e.label}</button>
        ))}
      </div>

      <Card className="p-4 mb-4 space-y-3">
        <div>
          <Label>Fecha *</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        {mode === "lote" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Finca</Label>
              <Select value={selectedFinca} onValueChange={setSelectedFinca}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {fincas.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lote *</Label>
              <Select value={selectedLote} onValueChange={setSelectedLote}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {filteredLotes.map(l => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Card>

      {mode === "individual" ? (
        <form onSubmit={handleIndividualSubmit}>
          <Card className="p-4 space-y-3 mb-4">
            <div>
              <Label>Animal * {selectedEspecie !== "all" && <span className="text-xs text-amber-600 ml-1">({filteredAnimals.length} disponibles)</span>}</Label>
              <Select value={selectedAnimal} onValueChange={setSelectedAnimal} required>
                <SelectTrigger><SelectValue placeholder="Buscar animal..." /></SelectTrigger>
                <SelectContent>
                  {filteredAnimals.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      #{a.numero} {a.nombre ? `(${a.nombre})` : ""} - {a.ultimo_peso ? `${a.ultimo_peso} kg` : "Sin peso"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Peso (kg) *</Label>
              <Input type="number" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} required placeholder="Ej: 340" className="text-lg h-12" />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>
          </Card>
          <Button type="submit" className="w-full h-12 text-base gap-2" disabled={createPesajeMutation.isPending || !selectedAnimal}>
            <Weight className="w-5 h-5" /> Guardar pesaje
          </Button>
        </form>
      ) : (
        <>
          {selectedLote ? (
            <>
              <Card className="p-4 mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Animal</th>
                        <th className="text-right py-2 font-medium">Último peso</th>
                        <th className="text-right py-2 font-medium w-32">Nuevo peso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAnimals.map(a => (
                        <tr key={a.id} className="border-b last:border-0">
                          <td className="py-2 font-medium">#{a.numero}</td>
                          <td className="py-2 text-right text-muted-foreground">{a.ultimo_peso ? formatWeight(a.ultimo_peso) : "—"}</td>
                          <td className="py-2">
                            <Input type="number" step="0.1" placeholder="kg" className="text-right h-9"
                              value={batchWeights[a.id] || ""}
                              onChange={(e) => setBatchWeights({ ...batchWeights, [a.id]: e.target.value })}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <Button
                onClick={handleBatchSubmit}
                className="w-full h-12 text-base gap-2"
                disabled={createPesajeMutation.isPending || Object.values(batchWeights).filter(w => w).length === 0}
              >
                <Weight className="w-5 h-5" />
                Guardar {Object.values(batchWeights).filter(w => w && parseFloat(w) > 0).length} pesajes
              </Button>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">Selecciona un lote para pesar los animales</p>
          )}
        </>
      )}
    </div>
  );
}