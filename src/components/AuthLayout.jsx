import React from "react";
import RJLogo from "@/components/RJLogo";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex bg-[#111111]">
      {/* Left brand panel - hidden on mobile */}
      <div className="hidden lg:flex w-80 flex-col items-center justify-center px-10 border-r border-white/10">
        <RJLogo size="xl" variant="sidebar" />
        <p className="text-white/40 text-sm text-center mt-6 leading-relaxed">
          Gestión integral de operaciones agropecuarias
        </p>
        <div className="mt-8 space-y-3 w-full">
          {["Bovinos · Ovinos · Equinos", "Reproducción y embriones", "Despachos de semen fresco", "Fincas · Lotes · Reportes"].map(t => (
            <div key={t} className="flex items-center gap-2 text-white/50 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 bg-[#f9f8f7]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <RJLogo size="lg" variant="default" className="justify-center" />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {children}
          </div>
          {footer && (
            <p className="text-center text-sm text-muted-foreground mt-5">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}