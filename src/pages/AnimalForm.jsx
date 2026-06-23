import React, { useState, useEffect } from "react";
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
import { ESTADO_ANIMAL, getRazasByEspecie, calcEdadDesdeNacimiento } from "@/lib/helpers";

export default function AnimalForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const queryClient = useQueryClient();
  const [moreDetails, setMoreDetails] = useState(false);
  const [especie, setEspecie] = useState("bovino");
  const [pesoCompra, setPesoCompra] = useState("");
  const [precioCompra, setPrecioCompra] = useState("");
  const [precioKilo, setPrecioKilo] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [edadAprox, setEdadAprox] = useState("");

  const { data: animal } = useQuery({
    queryKey: ["animal", id],
    queryFn: () => base44.entities.Animal.filter({ id }),
    enabled: isEditing,
    select: (data) => data[0],
  });

  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });

  useEffect(() => {
    if (animal) {
      setEspecie(animal.especie || "bovino");
      setPesoCompra(animal.peso_compra?.toString() || "");
      setPrecioCompra(animal.precio_compra?.toString() || "");
      setPrecioKilo(animal.precio_kilo_compra?.toString() || "");
      setFechaNacimiento(animal.fecha_nacimiento || "");
      setEdadAprox(animal.edad_aproximada || "");
    }
  }, [animal]);

  // Auto-calcular precio/kilo
  useEffect(() => {
    if (pesoCompra && precioCompra && parseFloat(pesoCompra) > 0) {
      const kilo = Math.round(parseFloat(precioCompra) / parseFloat(pesoCompra));
      setPrecioKilo(kilo.toString());
    }
  }, [pesoCompra, precioCompra]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Animal.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["animals"] }); navigate("/animales"); },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Animal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["animals"] });
      queryClient.invalidateQueries({ queryKey: ["animal", id] });
      navigate(`/animales/${id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = { especie };
    for (const [key, value] of fd.entries()) {
      if (value !== "") {
        if (["peso_compra", "precio_compra", "precio_kilo_compra", "costo_transporte_inicial", "otros_costos_iniciales"].includes(key)) {
          data[key] = parseFloat(value);
        } else {
          data[key] = value;
        }
      }
    }
    // Auto precio kilo
    if (data.peso_compra && data.precio_compra && !data.precio_kilo_compra) {
      data.precio_kilo_compra = Math.round(data.precio_compra / data.peso_compra);
    }
    // Set initial weight
    if (data.peso_compra && !isEditing) {
      data.ultimo_peso = data.peso_compra;
      data.fecha_ultimo_pesaje = data.fecha_compra || new Date().toISOString().split("T")[0];
    }
    // Edad automática desde fecha de nacimiento
    if (fechaNacimiento) {
      data.fecha_nacimiento = fechaNacimiento;
      const edadCalc = calcEdadDesdeNacimiento(fechaNacimiento);
      data.edad_aproximada = edadCalc || edadAprox;
    } else if (edadAprox) {
      data.edad_aproximada = edadAprox;
    }
    if (isEditing) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const defaults = isEditing && animal ? animal : {};
  const razas = getRazasByEspecie(especie);

  const especieLabels = { bovino: "Bovino", ovino: "Ovino", equino: "Equino" };
  const especieSexoLabel = {
    bovino: { macho: "Macho (Toro / Novillo)", hembra: "Hembra (Vaca / Novilla)" },
    ovino: { macho: "Macho (Carnero)", hembra: "Hembra (Oveja / Borrega)" },
    equino: { macho: "Macho (Reproductor / Padrillo)", hembra: "Hembra (Yegua / Receptora)" },
  };
  const sexoLabels = especieSexoLabel[especie] || { macho: "Macho", hembra: "Hembra" };

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> Volver
      </Button>

      <h1 className="text-2xl font-heading font-bold mb-6">
        {isEditing ? `Editar ${especieLabels[especie]}` : `Nuevo Animal`}
      </h1>

      <form onSubmit={handleSubmit}>
        <Card className="p-5 space-y-4 mb-4">
          <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">Datos básicos</h2>

          {/* Especie */}
          <div>
            <Label>Especie *</Label>
            <div className="flex gap-2 mt-1">
              {[
                { key: "bovino", label: "🐄 Bovino" },
                { key: "ovino", label: "🐑 Ovino" },
                { key: "equino", label: "🐴 Equino" },
              ].map(e => (
                <button
                  key={e.key}
                  type="button"
                  onClick={() => setEspecie(e.key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    especie === e.key
                      ? "bg-amber-500 text-black border-amber-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

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
              <Label>Lote / Potrero</Label>
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
                  <SelectItem value="macho">{sexoLabels.macho}</SelectItem>
                  <SelectItem value="hembra">{sexoLabels.hembra}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Raza</Label>
              <Select name="raza" defaultValue={defaults.raza}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {razas.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
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
              <Input
                name="peso_compra"
                type="number"
                step="0.1"
                value={pesoCompra}
                onChange={e => setPesoCompra(e.target.value)}
                placeholder="Ej: 280"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Precio de compra total ($)</Label>
              <Input
                name="precio_compra"
                type="number"
                value={precioCompra}
                onChange={e => setPrecioCompra(e.target.value)}
                placeholder="Ej: 1.500.000"
              />
            </div>
            <div>
              <Label>Precio por kilo (auto)</Label>
              <Input
                name="precio_kilo_compra"
                type="number"
                value={precioKilo}
                onChange={e => setPrecioKilo(e.target.value)}
                placeholder="Calculado automático"
                className={pesoCompra && precioCompra ? "border-amber-400 bg-amber-50" : ""}
              />
              {pesoCompra && precioCompra && parseFloat(pesoCompra) > 0 && (
                <p className="text-xs text-amber-600 mt-0.5">✓ Calculado automáticamente</p>
              )}
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
                  <Input
                    name="fecha_nacimiento"
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Edad aproximada</Label>
                  <Input
                    name="edad_aproximada"
                    value={calcEdadDesdeNacimiento(fechaNacimiento) || edadAprox}
                    disabled={Boolean(calcEdadDesdeNacimiento(fechaNacimiento))}
                    onChange={(e) => setEdadAprox(e.target.value)}
                    placeholder={calcEdadDesdeNacimiento(fechaNacimiento) ? "" : "Ej: 2 años"}
                  />
                  {calcEdadDesdeNacimiento(fechaNacimiento) && (
                    <p className="text-xs text-amber-600 mt-0.5">✓ Calculada automáticamente</p>
                  )}
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

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {isEditing ? "Guardar cambios" : `Registrar ${especieLabels[especie]}`}
        </Button>
      </form>
    </div>
  );
}