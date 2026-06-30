import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCsv } from "@/lib/csv";

// Botón reutilizable para exportar datos a CSV (compatible con Excel).
// Props: data (array), filename (string), columns (array de {key,label}), label, icon
export default function CsvExportButton({ data = [], filename = "export.csv", columns, label = "Exportar CSV", icon: Icon = Download, size = "sm", variant = "outline", className = "" }) {
  const handleExport = () => {
    const date = new Date().toISOString().split("T")[0];
    exportToCsv(`${filename.replace(/\.csv$/i, "")}-${date}.csv`, data, columns);
  };
  return (
    <Button variant={variant} size={size} onClick={handleExport} className={`gap-2 ${className}`} disabled={data.length === 0}>
      <Icon className="w-4 h-4" /> {label}
    </Button>
  );
}