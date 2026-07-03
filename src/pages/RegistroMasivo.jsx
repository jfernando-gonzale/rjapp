import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowLeft, Copy, Upload, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency, SEXO_ANIMAL, getRazasByEspecie, ESPECIES, parseMoney } from "@/lib/helpers";
import MoneyInput from "@/components/shared/MoneyInput";
import ImportCsvDialog from "@/components/shared/ImportCsvDialog";
import { exportToCsv } from "@/lib/csv";

const today = new Date().toISOString().split("T")[0];

const emptyRow = { numero: "", peso_compra: "", precio_individual: "", color: "", observacion: "" };

export default function RegistroMasivo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });
  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });

  // Datos comunes del grupo
  const [especie, setEspecie] = useState("bovino");
  const [fincaId, setFincaId] = useState("");
  const [loteId, setLoteId] = useState("");
  const [sexo, setSexo] = useState("macho");
  const [raza, setRaza] = useState("");
  const [estado, setEstado] = useState("activo");
  const [fechaCompra, setFechaCompra] = useState(today);
  const [vendedor, setVendedor] = useState("");
  const [precioKilo, setPrecioKilo] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Filas individuales
  const [rows, setRows] = useState([
    { ...emptyRow }, { ...emptyRow }, { ...emptyRow },
  ]);
  const [importOpen, setImportOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState(null);

  const lotesForm = lotes.filter((l) => !l.especie || l.especie === especie || l.especie === "mixto");
  const razas = getRazasByEspecie(especie);

  const validRows = rows.filter((r) => r.numero.trim() !== "");
  const numAnimales = validRows.length;

  // Precio total por animal = peso × precio/kilo (o precio individual si se especifica)
  const getCostoPorAnimal = (row) => {
    const indiv = parseMoney(row.precio_individual);
    if (indiv) return indiv;
    const peso = parseFloat(row.peso_compra);
    const kilo = parseMoney(precioKilo);
    if (peso && kilo) return Math.round(peso * kilo);
    return null;
  };

  const getPrecioKilo = (row) => {
    return parseMoney(precioKilo) || null;
  };

  const updateRow = (idx, field, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };
  const addRow = () => setRows((prev) => [...prev, { ...emptyRow }]);
  const removeRow = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx));
  const copyLast = () => {
    const last = rows[rows.length - 1];
    setRows((prev) => [...prev, { ...last, numero: "" }]);
  };

  const importFields = [
    { key: "numero", label: "Número / Chapeta", required: true },
    { key: "peso_compra", label: "Peso compra (kg)" },
    { key: "precio_individual", label: "Precio individual" },
    { key: "color", label: "Color" },
    { key: "observacion", label: "Observación" },
  ];
  const handleImport = (imported) => {
    setRows(imported.map((r) => ({
      numero: r.numero || "",
      peso_compra: r.peso_compra || "",
      precio_individual: r.precio_individual || "",
      color: r.color || "",
      observacion: r.observacion || "",
    })));
  };

  const existingNumeros = useMemo(() => {
    const set = new Set();
    animals.filter((a) => (a.especie || "bovino") === especie).forEach((a) => set.add(a.numero));
    return set;
  }, [animals, especie]);

  const handleGuardar = async () => {
    if (!fincaId) { alert("Selecciona una finca"); return; }
    if (numAnimales === 0) { alert("Agrega al menos un animal con número"); return; }

    setSaving(true);
    try {
      const registros = validRows.map((r) => {
        const costo = getCostoPorAnimal(r);
        const kilo = getPrecioKilo(r);
        return {
          especie,
          numero: r.numero.trim(),
          finca_id: fincaId,
          lote_id: loteId || undefined,
          sexo: sexo || undefined,
          raza: raza || undefined,
          estado,
          fecha_compra: fechaCompra || undefined,
          peso_compra: parseFloat(r.peso_compra) || undefined,
          precio_compra: costo || undefined,
          precio_kilo_compra: kilo || undefined,
          vendedor: vendedor || undefined,
          color: r.color || undefined,
          observaciones: [observaciones, r.observacion].filter(Boolean).join(" · ") || undefined,
        };
      });

      const created = await base44.entities.Animal.bulkCreate(registros);

      // Gasto de compra (suma de precios individuales)
      const total = registros.reduce((s, r) => s + (r.precio_compra || 0), 0);
      if (total && created.length > 0) {
        await base44.entities.Gasto.create({
          fecha: fechaCompra || today,
          especie,
          categoria: "compra_animales",
          descripcion: `Compra de ${created.length} ${ESPECIES[especie]}${vendedor ? ` - ${vendedor}` : ""}`,
          valor: total,
          finca_id: fincaId,
          lote_id: loteId || undefined,
          tipo_gasto: "lote",
          observaciones: `Registro masivo: ${created.map((a) => "#" + a.numero).join(", ")}`,
        });
      }

      // Evento de ingreso
      await base44.entities.EventoCalendario.create({
        titulo: `Ingreso de ${created.length} ${ESPECIES[especie]}`,
        tipo_evento: "tarea",
        subtipo: "ingreso_compra",
        especie,
        finca_id: fincaId,
        lote_id: loteId || undefined,
        fecha: fechaCompra || today,
        estado: "completado",
        origen: "manual",
        es_derivado: false,
        observaciones: `Registro masivo: ${created.map((a) => "#" + a.numero).join(", ")}`,
      });

      queryClient.invalidateQueries({ queryKey: ["animals"] });
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
      queryClient.invalidateQueries({ queryKey: ["eventos_calendario"] });

      const duplicados = created.filter((a) => existingNumeros.has(a.numero)).length;
      setSummary({ creados: created.length, duplicados, total: total || null });
    } catch (err) {
      alert("Error al guardar: " + (err.message || "desconocido"));
    } finally {
      setSaving(false);
    }
  };

  if (summary) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
        <h2 className="text-xl font-heading font-bold">Registro masivo completado</h2>
        <p className="text-sm text-muted-foreground">
          Se crearon <span className="font-bold text-foreground">{summary.creados}</span> animales en la finca seleccionada.
          {summary.duplicados > 0 && (
            <span className="block mt-1 text-amber-600">⚠️ {summary.duplicados} animal(es) comparten número con otros ya existentes.</span>
          )}
        </p>
        {summary.total != null && <p className="text-sm">Gasto de compra registrado: <span className="font-bold">{formatCurrency(summary.total)}</span></p>}
        <div className="flex gap-2 justify-center pt-2">
          <Button variant="outline" onClick={() => navigate("/animales")}>Ver animales</Button>
          <Button onClick={() => { setSummary(null); setRows([{ ...emptyRow }, { ...emptyRow }, { ...emptyRow }]); }}>Nuevo registro</Button>
        </div>
      </div>
    );
  }

  const canSubmit = fincaId && numAnimales > 0 && !saving;

  return (
    <div>
      <Button variant="ghost" className="gap-2 mb-2" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /> Volver</Button>
      <PageHeader title="Registro masivo de animales" subtitle="Registra varios animales de una compra o lote a la vez" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Datos comunes */}
        <Card className="p-4 lg:col-span-1 space-y-3 h-fit">
          <h3 className="font-heading font-semibold">Datos del grupo</h3>
          <div>
            <Label className="text-xs mb-1 block">Especie *</Label>
            <Select value={especie} onValueChange={(v) => { setEspecie(v); setRaza(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bovino">🐄 Bovino</SelectItem>
                <SelectItem value="ovino">🐑 Ovino</SelectItem>
                <SelectItem value="equino">🐴 Equino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Finca *</Label>
            <Select value={fincaId} onValueChange={setFincaId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {fincas.map((f) => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Lote / Potrero</Label>
            <Select value={loteId} onValueChange={setLoteId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Sin lote</SelectItem>
                {lotesForm.map((l) => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs mb-1 block">Sexo común</Label>
              <Select value={sexo} onValueChange={setSexo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SEXO_ANIMAL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Estado inicial</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="descartado">Descartado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Raza común</Label>
            <Select value={raza} onValueChange={setRaza}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {razas.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Fecha de compra / ingreso</Label>
            <Input type="date" value={fechaCompra} onChange={(e) => setFechaCompra(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Vendedor</Label>
            <Input value={vendedor} onChange={(e) => setVendedor(e.target.value)} placeholder="Nombre" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Precio por kilo común ($/kg)</Label>
            <MoneyInput value={precioKilo} onChange={setPrecioKilo} placeholder="Ej: 7500" />
            {numAnimales > 0 && (
              <p className="text-xs text-amber-700 mt-1">Total del lote: {formatCurrency(validRows.reduce((s, r) => s + (getCostoPorAnimal(r) || 0), 0))}</p>
            )}
          </div>
          <div>
            <Label className="text-xs mb-1 block">Observaciones generales</Label>
            <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} />
          </div>
        </Card>

        {/* Tabla de animales */}
        <Card className="p-4 lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-heading font-semibold">Animales individuales ({numAnimales})</h3>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={() => setImportOpen(true)} className="gap-1"><Upload className="w-3.5 h-3.5" /> Importar</Button>
              <Button size="sm" variant="outline" onClick={copyLast} className="gap-1"><Copy className="w-3.5 h-3.5" /> Copiar</Button>
              <Button size="sm" variant="outline" onClick={() => exportToCsv("plantilla-animales.csv", [{ numero: "", peso_compra: "", precio_individual: "", color: "", observacion: "" }])} className="gap-1">Plantilla</Button>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">N° / Chapeta *</th>
                  <th className="text-left p-2 font-medium">Peso (kg)</th>
                  <th className="text-left p-2 font-medium">Precio indiv.</th>
                  <th className="text-left p-2 font-medium">Costo asign.</th>
                  <th className="text-left p-2 font-medium">$/Kg</th>
                  <th className="text-left p-2 font-medium">Color</th>
                  <th className="text-left p-2 font-medium">Obs.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const existe = row.numero && existingNumeros.has(row.numero.trim());
                  const costo = getCostoPorAnimal(row);
                  const precioKilo = getPrecioKilo(row);
                  return (
                    <tr key={idx} className="border-t">
                      <td className="p-1.5">
                        <Input value={row.numero} onChange={(e) => updateRow(idx, "numero", e.target.value)} className={`h-8 ${existe ? "border-amber-400" : ""}`} placeholder="#" />
                        {existe && <span className="text-[10px] text-amber-600">ya existe</span>}
                      </td>
                      <td className="p-1.5"><Input type="number" value={row.peso_compra} onChange={(e) => updateRow(idx, "peso_compra", e.target.value)} className="h-8 w-20" /></td>
                      <td className="p-1.5"><MoneyInput value={row.precio_individual} onChange={(v) => updateRow(idx, "precio_individual", v)} className="h-8 w-24" /></td>
                      <td className="p-1.5 text-xs font-medium">{costo != null ? formatCurrency(costo) : "—"}</td>
                      <td className="p-1.5 text-xs">{precioKilo != null ? formatCurrency(precioKilo) : "—"}</td>
                      <td className="p-1.5"><Input value={row.color} onChange={(e) => updateRow(idx, "color", e.target.value)} className="h-8 w-20" /></td>
                      <td className="p-1.5"><Input value={row.observacion} onChange={(e) => updateRow(idx, "observacion", e.target.value)} className="h-8 w-24" /></td>
                      <td className="p-1.5"><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeRow(idx)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Button variant="outline" size="sm" onClick={addRow} className="gap-2"><Plus className="w-4 h-4" /> Agregar fila</Button>

          <div className="flex justify-end pt-2">
            <Button onClick={handleGuardar} disabled={!canSubmit} className="gap-2 h-12 px-8">
              {saving ? "Guardando..." : `Registrar ${numAnimales} animal${numAnimales !== 1 ? "es" : ""}`}
            </Button>
          </div>
        </Card>
      </div>

      <ImportCsvDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        fields={importFields}
        onImport={handleImport}
        entityLabel="animales"
      />
    </div>
  );
}