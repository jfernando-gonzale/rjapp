import React, { useState } from "react";
import { Input } from "@/components/ui/input";

// Input monetario con formato colombiano: $ 10.000
// Acepta entrada como 10000, 10.000, $10000, $ 10.000 → valor interno limpio (10000)
// Soporta modo controlado (value/onChange) y no controlado (defaultValue).
export default function MoneyInput({ value, defaultValue, onChange, name, placeholder, className, ...props }) {
  const [internalValue, setInternalValue] = useState(defaultValue != null ? String(defaultValue) : "");
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const formatDisplay = (val) => {
    if (val == null || val === "") return "";
    const num = String(val).replace(/[^0-9]/g, "");
    if (!num) return "";
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (!isControlled) setInternalValue(raw);
    if (onChange) onChange(raw);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none z-10">$</span>
      <Input
        name={name}
        value={formatDisplay(currentValue)}
        onChange={handleChange}
        placeholder={placeholder}
        className={`pl-7 ${className || ""}`}
        inputMode="numeric"
        {...props}
      />
    </div>
  );
}