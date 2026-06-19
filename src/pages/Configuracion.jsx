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
    good_gain_threshold: 0.8,
    medium_gain_threshold: 0.4,
  });

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user) {
      setFormData({
        business_name: user.business_name || "",
        currency: user.currency || "COP",
        weight_unit: user.weight_unit || "kg",
        weighing_frequency_days: user.weighing_frequency_days || 30,
        good_gain_threshold: user.good_gain_threshold || 0.8,
        medium_gain_threshold: user.medium_gain_threshold || 0.4,
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
      weighing_frequency_days: parseInt(formData.weighing_frequency_days),
      good_gain_threshold: parseFloat(formData.good_gain_threshold),
      medium_gain_threshold: parseFloat(formData.medium_gain_threshold),
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Configuración" subtitle="Personaliza tu libreta ganadera" />

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

      <Card className="p-5 space-y-5 mb-4">
        <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">Indicadores de rendimiento</h2>
        <p className="text-sm text-muted-foreground">Define los rangos para clasificar la ganancia diaria de peso.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-emerald-600">Buena ganancia (≥ kg/día)</Label>
            <Input type="number" step="0.1" value={formData.good_gain_threshold} onChange={(e) => setFormData({ ...formData, good_gain_threshold: e.target.value })} />
          </div>
          <div>
            <Label className="text-amber-600">Ganancia media (≥ kg/día)</Label>
            <Input type="number" step="0.1" value={formData.medium_gain_threshold} onChange={(e) => setFormData({ ...formData, medium_gain_threshold: e.target.value })} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Por debajo de {formData.medium_gain_threshold} kg/día se considera baja ganancia (indicador rojo).
        </p>
      </Card>

      <Button onClick={handleSave} className="w-full h-12 gap-2" disabled={updateMutation.isPending}>
        {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
        {saved ? "¡Guardado!" : "Guardar configuración"}
      </Button>
    </div>
  );
}