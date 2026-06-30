import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save, Check } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

export default function Configuracion() {
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    currency: "COP",
    weight_unit: "kg",
    weighing_frequency_days: 30,
    umbrales_productivos: {
      bovino: { excelente: 0.80, bueno: 0.50, regular: 0.25, bajo: 0.01 },
      ovino: { excelente: 0.25, bueno: 0.15, regular: 0.08, bajo: 0.01 },
      equino: { excelente: 0.60, bueno: 0.35, regular: 0.15, bajo: 0.01 },
    },
  });

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user) {
      let umb = user.umbrales_productivos;
      if (typeof umb === "string") { try { umb = JSON.parse(umb); } catch { umb = null; } }
      if (!umb) umb = {
        bovino: { excelente: 0.80, bueno: 0.50, regular: 0.25, bajo: 0.01 },
        ovino: { excelente: 0.25, bueno: 0.15, regular: 0.08, bajo: 0.01 },
        equino: { excelente: 0.60, bueno: 0.35, regular: 0.15, bajo: 0.01 },
      };
      setFormData({
        business_name: user.business_name || "",
        currency: user.currency || "COP",
        weight_unit: user.weight_unit || "kg",
        weighing_frequency_days: user.weighing_frequency_days || 30,
        umbrales_productivos: { ...umb },
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      ...formData,
      umbrales_productivos: JSON.stringify(formData.umbrales_productivos),
      weighing_frequency_days: parseInt(formData.weighing_frequency_days),
    });
  };

  const updateUmbral = (especie, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      umbrales_productivos: {
        ...prev.umbrales_productivos,
        [especie]: { ...prev.umbrales_productivos[especie], [campo]: parseFloat(valor) || 0 },
      },
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Configuración" subtitle="Personaliza tu cuenta RJAPP" />

      <Card className="p-5 space-y-5 mb-4">
        <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">General</h2>
        <div>
          <Label>Nombre del negocio</Label>
          <Input value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} placeholder="Ej: Ganadería El Porvenir" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Moneda</Label>
            <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="COP">COP (Pesos colombianos)</SelectItem>
                <SelectItem value="USD">USD (Dólares)</SelectItem>
                <SelectItem value="MXN">MXN (Pesos mexicanos)</SelectItem>
                <SelectItem value="ARS">ARS (Pesos argentinos)</SelectItem>
                <SelectItem value="BRL">BRL (Reales)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Unidad de peso</Label>
            <Select value={formData.weight_unit} onValueChange={(v) => setFormData({ ...formData, weight_unit: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                <SelectItem value="lb">Libras (lb)</SelectItem>
                <SelectItem value="@">Arrobas (@)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-5 mb-4">
        <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">Pesajes</h2>
        <div>
          <Label>Frecuencia recomendada de pesaje (días)</Label>
          <Select value={String(formData.weighing_frequency_days)} onValueChange={(v) => setFormData({ ...formData, weighing_frequency_days: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15">Cada 15 días</SelectItem>
              <SelectItem value="30">Cada 30 días</SelectItem>
              <SelectItem value="45">Cada 45 días</SelectItem>
              <SelectItem value="60">Cada 60 días</SelectItem>
              <SelectItem value="90">Cada 90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-5 space-y-4 mb-4">
        <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">Umbrales productivos por especie</h2>
        <p className="text-sm text-muted-foreground">Clasificación de ganancia diaria con 5 niveles. Los valores dependen de raza, edad, alimentación, clima y sistema productivo.</p>
        {["bovino", "ovino", "equino"].map(esp => (
          <div key={esp} className="border rounded-lg p-3 space-y-2">
            <h3 className="font-semibold capitalize text-sm">{esp === "bovino" ? "🐄 Bovinos" : esp === "ovino" ? "🐑 Ovinos" : "🐴 Equinos (potros)"}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <Label className="text-emerald-600 text-xs">Excelente ≥</Label>
                <Input type="number" step="0.01" value={formData.umbrales_productivos[esp].excelente}
                  onChange={(e) => updateUmbral(esp, "excelente", e.target.value)} />
              </div>
              <div>
                <Label className="text-green-600 text-xs">Bueno ≥</Label>
                <Input type="number" step="0.01" value={formData.umbrales_productivos[esp].bueno}
                  onChange={(e) => updateUmbral(esp, "bueno", e.target.value)} />
              </div>
              <div>
                <Label className="text-amber-600 text-xs">Regular ≥</Label>
                <Input type="number" step="0.01" value={formData.umbrales_productivos[esp].regular}
                  onChange={(e) => updateUmbral(esp, "regular", e.target.value)} />
              </div>
              <div>
                <Label className="text-orange-600 text-xs">Bajo ≥</Label>
                <Input type="number" step="0.01" value={formData.umbrales_productivos[esp].bajo}
                  onChange={(e) => updateUmbral(esp, "bajo", e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {esp === "equino" && "Solo aplica a potros en crecimiento, no a equinos adultos. "}
              Crítico: ganancia ≤ 0 o negativa (indicador rojo).
            </p>
          </div>
        ))}
      </Card>

      <Button onClick={handleSave} className="w-full h-12 gap-2" disabled={updateMutation.isPending}>
        {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
        {saved ? "¡Guardado!" : "Guardar configuración"}
      </Button>
    </div>
  );
}