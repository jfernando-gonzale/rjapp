import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { buildAlertasRentabilidad } from "@/lib/alertasRentabilidad";
import { TrendingUp } from "lucide-react";

const SEVERITY_STYLES = {
  rojo: { border: "border-l-red-500", bg: "bg-red-50", icon: "text-red-600" },
  amarillo: { border: "border-l-amber-500", bg: "bg-amber-50", icon: "text-amber-600" },
  verde: { border: "border-l-emerald-500", bg: "bg-emerald-50", icon: "text-emerald-600" },
  gris: { border: "border-l-gray-300", bg: "bg-gray-50", icon: "text-gray-400" },
};

export default function AlertasRentabilidad({ animals, gastos, ventas, tratamientos, procedimientos, lotes, fincas, user }) {
  const alerts = useMemo(
    () => buildAlertasRentabilidad(animals, gastos, ventas, tratamientos, procedimientos, lotes, fincas, user),
    [animals, gastos, ventas, tratamientos, procedimientos, lotes, fincas, user]
  );

  if (alerts.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Alertas de rentabilidad
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {alerts.slice(0, 9).map((a, i) => {
          const st = SEVERITY_STYLES[a.severidad] || SEVERITY_STYLES.gris;
          return (
            <Link key={i} to={a.link}>
              <Card className={`p-4 border-l-4 ${st.border} hover:shadow-md transition-all cursor-pointer h-full`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg ${st.bg} flex items-center justify-center shrink-0`}>
                    <TrendingUp className={`w-5 h-5 ${st.icon}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">{a.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.detalle}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}