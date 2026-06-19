import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, color = "primary", className }) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-amber-50 text-amber-600",
    success: "bg-emerald-50 text-emerald-600",
    danger: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Card className={cn("p-4 lg:p-5 hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs lg:text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className="text-xl lg:text-2xl font-heading font-bold truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={cn("p-2 lg:p-2.5 rounded-xl flex-shrink-0 ml-3", colorClasses[color])}>
            <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
        )}
      </div>
    </Card>
  );
}