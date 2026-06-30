import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ReproStatCard from "./ReproStatCard";
import ReproDetailDialog from "./ReproDetailDialog";
import ReproDetalleTable from "./ReproDetalleTable";

export default function ReproInteractivo({ cards, allItems, columns, especieLabel, children }) {
  const [activeCardKey, setActiveCardKey] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeCard = activeCardKey ? cards.find(c => c.key === activeCardKey) : null;
  const tableItems = activeCard ? activeCard.items : allItems;

  const handleCardClick = (card) => {
    setActiveCardKey(card.key);
    setDialogOpen(true);
  };

  const handleClearFilter = () => setActiveCardKey(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(card => (
          <ReproStatCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={card.value}
            sub={card.sub}
            color={card.color}
            tooltip={card.tooltip}
            onClick={() => handleCardClick(card)}
            active={activeCardKey === card.key}
          />
        ))}
      </div>

      {activeCard && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-700">
            Filtro activo: {activeCard.label}
          </span>
          <Button size="sm" variant="ghost" onClick={handleClearFilter} className="text-xs h-7 gap-1">
            <X className="w-3 h-3" /> Limpiar filtro
          </Button>
        </div>
      )}

      <Card className="p-4">
        <h3 className="font-heading font-semibold mb-3">
          Detalle reproductivo {activeCard ? `· ${activeCard.label}` : `· ${especieLabel}`}
        </h3>
        <ReproDetalleTable columns={columns} items={tableItems} />
      </Card>

      <ReproDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={activeCard?.label || ""}
        subtitle={activeCard?.detailSubtitle}
        items={activeCard?.items || []}
      />

      {children}
    </div>
  );
}