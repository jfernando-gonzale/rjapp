import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { readFileAsCsv } from "@/lib/csv";

// Dialog reutilizable para importar CSV/Excel.
// Props:
//   open, onOpenChange
//   fields: [{ key, label, required }] — campos destino de la entidad
//   onImport: (rows) => Promise — recibe filas ya mapeadas (objetos). El padre hace dedup + create.
//   entityLabel: string — nombre de la entidad para textos
export default function ImportCsvDialog({ open, onOpenChange, fields, onImport, entityLabel = "registros" }) {
  const [step, setStep] = useState("upload"); // upload | map | preview
  const [rawRows, setRawRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({}); // { fieldKey: headerIndex | "ignore" }
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const reset = () => {
    setStep("upload"); setRawRows([]); setHeaders([]); setMapping({}); setResult(null);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await readFileAsCsv(file);
      if (rows.length < 2) {
        setResult({ error: "El archivo no tiene datos suficientes (se necesita encabezado + filas)." });
        return;
      }
      const hdrs = rows[0].map((h) => (h || "").trim());
      setHeaders(hdrs);
      setRawRows(rows.slice(1, 51)); // vista previa: 50 filas
      const auto = {};
      fields.forEach((f) => {
        const match = hdrs.findIndex((h) =>
          h.toLowerCase().includes(f.key.toLowerCase()) ||
          f.label.toLowerCase().split(" ")[0] && h.toLowerCase().includes(f.label.toLowerCase().split(" ")[0])
        );
        auto[f.key] = match >= 0 ? String(match) : "ignore";
      });
      setMapping(auto);
      setStep("map");
    } catch (err) {
      setResult({ error: err.message || "Error al leer el archivo" });
    }
  };

  const allRowsParsed = rawRows.map((r) => {
    const obj = {};
    fields.forEach((f) => {
      const idx = mapping[f.key];
      obj[f.key] = idx && idx !== "ignore" ? r[Number(idx)]?.trim() || "" : "";
    });
    return obj;
  });

  const validRows = allRowsParsed.filter((r) => fields.every((f) => !f.required || r[f.key]));
  const errorRows = allRowsParsed.filter((r) => !fields.every((f) => !f.required || r[f.key]));

  const handleConfirm = async () => {
    setImporting(true);
    try {
      await onImport(validRows);
      setResult({ success: true, count: validRows.length });
      setStep("done");
    } catch (err) {
      setResult({ error: err.message || "Error al importar" });
    } finally {
      setImporting(false);
    }
  };

  const close = (open) => { onOpenChange(open); if (!open) reset(); };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Importar {entityLabel} desde Excel/CSV</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sube un archivo CSV (compatible con Excel). La primera fila debe tener los encabezados de las columnas.
            </p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-amber-400 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium">Click para seleccionar archivo</span>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
            </label>
            {result?.error && <p className="text-sm text-red-600">{result.error}</p>}
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Relaciona las columnas del archivo con los campos de RJAPP:</p>
            <div className="space-y-2">
              {fields.map((f) => (
                <div key={f.key} className="grid grid-cols-2 gap-2 items-center">
                  <Label className="text-sm">{f.label} {f.required && <span className="text-red-500">*</span>}</Label>
                  <Select value={mapping[f.key] || "ignore"} onValueChange={(v) => setMapping({ ...mapping, [f.key]: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">— Ignorar —</SelectItem>
                      {headers.map((h, i) => <SelectItem key={i} value={String(i)}>{h || `Columna ${i + 1}`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <p className="text-xs font-medium px-3 py-2 bg-muted">Vista previa ({rawRows.length} filas)</p>
              <div className="overflow-x-auto max-h-48">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      {fields.filter((f) => mapping[f.key] && mapping[f.key] !== "ignore").map((f) => (
                        <th key={f.key} className="text-left p-2 font-medium whitespace-nowrap">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allRowsParsed.slice(0, 8).map((r, i) => (
                      <tr key={i} className="border-t">
                        {fields.filter((f) => mapping[f.key] && mapping[f.key] !== "ignore").map((f) => (
                          <td key={f.key} className="p-2 whitespace-nowrap">{r[f.key] || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {validRows.length} válidas</span>
              {errorRows.length > 0 && (
                <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {errorRows.length} con errores</span>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("upload")}>Atrás</Button>
              <Button onClick={handleConfirm} disabled={validRows.length === 0 || importing} className="gap-2">
                {importing ? "Importando..." : `Importar ${validRows.length} ${entityLabel}`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="font-medium">Importación completada</p>
            {result?.success && <p className="text-sm text-muted-foreground">{result.count} {entityLabel} importados correctamente.</p>}
            <Button onClick={() => close(false)}>Cerrar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}