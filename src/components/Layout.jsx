import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Home, Scale, Syringe, DollarSign, ShoppingCart, BarChart3,
  Settings, Menu, X, ChevronRight, LogOut, Bell, Truck,
  Users, MapPin, Layers, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import RJLogo from "@/components/RJLogo";

// Iconos SVG personalizados agropecuarios
const CowIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 12c0-4 2-6 4-7l1-2h6l1 2c2 1 4 3 4 7v4H4v-4z"/>
    <circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/>
    <path d="M9 16s1 1.5 3 1.5 3-1.5 3-1.5"/>
    <path d="M4 12H2l-1 3h3"/><path d="M20 12h2l1 3h-3"/>
    <path d="M7 5l-2-2"/><path d="M17 5l2-2"/>
  </svg>
);
const SheepIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 4c-3 0-6 2-6 5s3 5 6 5 6-2 6-5-3-5-6-5z"/>
    <path d="M8 14v4"/><path d="M16 14v4"/>
    <circle cx="10" cy="9" r="1"/><circle cx="14" cy="9" r="1"/>
    <path d="M6 7c-1.5-.5-3 .5-3 2s1.5 2.5 3 2"/>
    <path d="M18 7c1.5-.5 3 .5 3 2s-1.5 2.5-3 2"/>
  </svg>
);
const HorseIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 20V14c0-4 3-7 7-7s7 3 7 7v2"/>
    <path d="M15 7V4l3-1-1 4"/>
    <path d="M9 14h6"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/>
    <path d="M8 20v-3"/><path d="M16 20v-3"/>
  </svg>
);
const FarmIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <path d="M9 22V12h6v10"/>
    <path d="M2 9h20"/>
  </svg>
);
const FenceIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 3v18"/><path d="M8 3v18"/><path d="M12 3v18"/><path d="M16 3v18"/><path d="M20 3v18"/>
    <path d="M2 8h20"/><path d="M2 16h20"/>
  </svg>
);
const ReproIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="8" r="4"/>
    <path d="M12 12v4"/><path d="M10 14h4"/>
    <path d="M7 20c0-2.5 2-4 5-4s5 1.5 5 4"/>
    <circle cx="7" cy="6" r="2"/><circle cx="17" cy="6" r="2"/>
  </svg>
);

const navGroups = [
  {
    label: "Principal",
    items: [
      { path: "/", label: "Inicio", icon: Home },
    ]
  },
  {
    label: "Especies",
    items: [
      { path: "/bovinos", label: "Bovinos", icon: CowIcon },
      { path: "/ovinos", label: "Ovinos", icon: SheepIcon },
      { path: "/equinos", label: "Equinos", icon: HorseIcon },
    ]
  },
  {
    label: "Operación",
    items: [
      { path: "/fincas", label: "Fincas", icon: FarmIcon },
      { path: "/lotes", label: "Lotes / Potreros", icon: FenceIcon },
      { path: "/pesajes", label: "Pesajes", icon: Scale },
      { path: "/tratamientos", label: "Tratamientos", icon: Syringe },
      { path: "/reproduccion", label: "Reproducción", icon: ReproIcon },
    ]
  },
  {
    label: "Comercial",
    items: [
      { path: "/gastos", label: "Gastos", icon: DollarSign },
      { path: "/ventas", label: "Ventas", icon: ShoppingCart },
      { path: "/clientes", label: "Clientes", icon: Users },
      { path: "/despachos", label: "Despachos", icon: Truck },
    ]
  },
  {
    label: "Análisis",
    items: [
      { path: "/reportes", label: "Reportes", icon: BarChart3 },
      { path: "/calendario", label: "Calendario / Alertas", icon: Bell },
    ]
  },
  {
    label: "Sistema",
    items: [
      { path: "/configuracion", label: "Configuración", icon: Settings },
    ]
  },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col transition-transform duration-300 ease-in-out",
        "bg-[#111111] text-white",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo area */}
        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <RJLogo size="md" variant="sidebar" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        active
                          ? "bg-amber-500 text-black shadow-md shadow-amber-500/25"
                          : "text-white/65 hover:bg-white/8 hover:text-white"
                      )}
                    >
                      <item.icon className="w-4.5 h-4.5 flex-shrink-0 w-[18px] h-[18px]" />
                      <span>{item.label}</span>
                      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:bg-white/8 hover:text-white w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#111111] px-4 py-3 flex items-center justify-between shadow-md">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-white/10 text-white">
            <Menu className="w-6 h-6" />
          </button>
          <RJLogo size="sm" variant="sidebar" />
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}