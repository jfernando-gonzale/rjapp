import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGainColor, getGainLabel } from "@/lib/helpers";

const iconMap = {
  green: TrendingUp,
  yellow: Minus,
  red: TrendingDown,
  gray: Minus,
};

const colorClasses = {
  green: "text-emerald-600 bg-emerald-50",
  yellow: "text-amber-600 bg-amber-50",
  red: "text-red-600 bg-red-50",
  gray: "text-gray-400 bg-gray-50",
};

export default function GainIndicator({ dailyGain, goodThreshold = 0.8, mediumThreshold = 0.4, showLabel = true, size = "sm" }) {
  const color = getGainColor(dailyGain, goodThreshold, mediumThreshold);
  const Icon = iconMap[color];
  const label = getGainLabel(color);
  
  const sizeClasses = size === "lg" ? "text-sm px-3 py-1.5 gap-2" : "text-xs px-2 py-1 gap-1";

  return (
    <div className={cn("inline-flex items-center rounded-full font-medium", colorClasses[color], sizeClasses)}>
      <Icon className={size === "lg" ? "w-4 h-4" : "w-3 h-3"} />
      {dailyGain != null ? (
        <span>{dailyGain.toFixed(2)} kg/día</span>
      ) : (
        showLabel && <span>{label}</span>
      )}
    </div>
  );
}