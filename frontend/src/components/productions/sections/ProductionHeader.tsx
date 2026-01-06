'use client';

import { Plus } from 'lucide-react';
import { Button } from '../ui/button';

interface ProductionHeaderProps {
  onCreateClick: () => void;
}

export function ProductionHeader({ onCreateClick }: ProductionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50 mb-2">
          Produções
        </h1>
        <p className="text-slate-400">
          Gerencie todas as suas produções audiovisuais
        </p>
      </div>
      <Button
        onClick={onCreateClick}
        className="bg-slate-800 hover:bg-slate-700 border border-slate-600"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nova Produção
      </Button>
    </div>
  );
}


