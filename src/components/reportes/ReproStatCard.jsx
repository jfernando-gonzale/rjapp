import React from "react";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

const colorMap = {
  emerald: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  purple: "bg-purple-50 text-purple-600",
  gray: "bg-gray-100 text-gray-500",
};

export default function ReproStatCard({ icon: Icon, label, value, sub, color = "gray", tooltip, onClick, active }) {
  const clickable = !!onClick;
  return (
    <Card
      className={`p-3 transition-all ${clickable ? "cursor-pointer hover:ring-2 hover:ring-amber-400 hover:shadow-md" : ""} ${active ? "ring-2 ring-amber-500 shadow-md" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded-lg ${colorMap[color] || colorMap.gray} shrink-0`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground font-medium leading-tight">{label}</p>
          {tooltip && (
            <span title={tooltip} className="cursor-help shrink-0">
              <Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground" />
            </span>
          )}
        </div>
      </div>
      <p className="text-lg font-bold">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </Card>
  );
}