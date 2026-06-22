import React from "react";
import { cn } from "@/lib/utils";

export default function RJLogo({ size = "md", variant = "default", className }) {
  const sizes = {
    sm: { outer: "w-8 h-8", text: "text-sm", sub: "text-[9px]" },
    md: { outer: "w-10 h-10", text: "text-base", sub: "text-[10px]" },
    lg: { outer: "w-14 h-14", text: "text-xl", sub: "text-xs" },
    xl: { outer: "w-20 h-20", text: "text-3xl", sub: "text-sm" },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Logo mark */}
      <div className={cn(
        s.outer,
        "rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden",
        variant === "sidebar"
          ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg"
          : "bg-gradient-to-br from-amber-400 to-amber-600 shadow-md"
      )}>
        <span className={cn("font-heading font-black text-black tracking-tight", s.text)}>
          RJ
        </span>
      </div>
      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span className={cn(
          "font-heading font-black tracking-widest",
          s.text,
          variant === "sidebar" ? "text-white" : "text-gray-900"
        )}>
          RJAPP
        </span>
        <span className={cn(
          s.sub,
          variant === "sidebar" ? "text-amber-400/80" : "text-amber-600/80",
          "font-medium tracking-wide"
        )}>
          Gestión Agropecuaria
        </span>
      </div>
    </div>
  );
}