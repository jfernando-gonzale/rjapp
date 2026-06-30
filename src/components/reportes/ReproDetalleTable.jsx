import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function ReproDetalleTable({ columns, items }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">No hay datos para mostrar en la tabla.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map(col => (
              <th key={col.key} className="text-left py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id || idx} className="border-b border-border/50 hover:bg-muted/30">
              {columns.map(col => (
                <td key={col.key} className="py-2 px-2 whitespace-nowrap align-top">
                  {col.render ? col.render(item) : (item[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AccionCell({ item, actionLinks = [] }) {
  const links = [{ label: "Ver hoja de vida", to: item.link, variant: "outline" }, ...actionLinks];
  return (
    <div className="flex flex-wrap gap-1">
      {links.map((lnk, i) => (
        lnk.to ? (
          <Button key={i} asChild size="sm" variant={lnk.variant || "ghost"} className="h-7 text-xs gap-1">
            <Link to={lnk.to}><ExternalLink className="w-3 h-3" />{lnk.label}</Link>
          </Button>
        ) : null
      ))}
    </div>
  );
}