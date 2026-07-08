import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DISTRIBUCION_OPCIONES } from "@/lib/distribucionGastos";
import { formatCurrency } from "@/lib/helpers";
import { Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function GastoDistribucion({
  metodo,
  onMetodoChange,
  valor,
  animales,
  manual,
  onManualChange,
  distribucion,
  validacion,
  sinPeso,
}) {
  const valorNum = Number(valor) || 0;
  const sumaManual = validacion?.suma || 0;

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-amber-600" />
        <h4 className="font-heading font-semibold text-sm">Distribución del gasto</h4>
      </div>

      <div>
        <Label className="text-xs">Método de distribución</Label>
        <Select value={metodo} onValueChange={onMetodoChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {DISTRIBUCION_OPCIONES.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {DISTRIBUCION_OPCIONES.filter((o) => o.value === metodo).map((o) => (
          <p key={o.value} className="text-xs text-muted-foreground mt-1">{o.desc}</p>
        ))}
      </div>

      {/* Advertencia: por peso con animales sin peso */}
      {metodo === "por_peso" && sinPeso > 0 && (
        <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            {sinPeso} animal{sinPeso > 1 ? "es" : ""} no tiene peso registrado. Puedes distribuir por animal o completar los pesos.
          </p>
        </div>
      )}

      {/* Advertencia: manual sin coincidir */}
      {metodo === "manual" && !validacion?.valid && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            La suma distribuida ({formatCurrency(sumaManual)}) no coincide con el valor total del gasto ({formatCurrency(valorNum)}).
            Diferencia: {formatCurrency(Math.abs(validacion?.diferencia || 0))}.
          </p>
        </div>
      )}

      {/* Vista previa de la distribución */}
      {metodo !== "no_distribuir" && distribucion.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            {metodo === "manual" && validacion?.valid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            <p className="text-xs font-semibold text-muted-foreground">
              Vista previa · {distribucion.length} animal{distribucion.length > 1 ? "es" : ""}
            </p>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {distribucion.map((d) => (
              <div key={d.animal_id} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-muted/50 last:border-0">
                <span className="font-medium truncate">#{d.numero || "—"}{d.nombre ? ` ${d.nombre}` : ""}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {metodo === "manual" ? (
                    <Input
                      type="text"
                      inputMode="numeric"
                      className="h-7 w-24 text-right text-xs"
                      value={manual[d.animal_id] || ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        onManualChange({ ...manual, [d.animal_id]: raw });
                      }}
                      placeholder="0"
                    />
                  ) : (
                    <>
                      {d.peso != null && <span className="text-muted-foreground">{d.peso} kg</span>}
                      <span className="font-medium">{formatCurrency(d.monto)}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {metodo === "no_distribuir" && (
        <p className="text-xs text-muted-foreground">El gasto quedará registrado sin repartir a animales específicos.</p>
      )}
    </div>
  );
}