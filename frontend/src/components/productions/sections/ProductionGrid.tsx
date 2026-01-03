import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, DollarSign, TrendingUp, Trash2, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Interface simplificada para o grid
interface Production {
  id: number | string;
  title: string;
  status: string;
  deadline: string | null;
  payment_method: string | null;
  total_value: number;
  profit: number;
}

type ProductionStatus = 'draft' | 'proposal_sent' | 'approved' | 'in_progress' | 'completed' | 'canceled';

const statusLabels: Record<ProductionStatus, string> = {
  draft: 'Rascunho',
  proposal_sent: 'Proposta Enviada',
  approved: 'Aprovada',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  canceled: 'Cancelada',
};

const statusColors: Record<ProductionStatus, string> = {
  draft: 'bg-slate-600',
  proposal_sent: 'bg-blue-600',
  approved: 'bg-green-600',
  in_progress: 'bg-yellow-600',
  completed: 'bg-purple-600',
  canceled: 'bg-red-600',
};

const paymentMethodLabels: Record<string, string> = {
  pix: 'PIX',
  credit: 'Crédito',
  debit: 'Débito',
  link: 'Link',
  crypto: 'Crypto',
  boleto: 'Boleto',
};

interface ProductionGridProps {
  productions: Production[];
  searchTerm: string;
  statusFilter: string;
  privacyMode: boolean;
  onEdit: (production: Production) => void;
  onDelete?: (production: Production) => void;
}

interface Production {
  id: number | string;
  title: string;
  status: string;
  deadline: string | null;
  payment_method: string | null;
  total_value: number;
  profit: number;
}

export function ProductionGrid({
  productions,
  searchTerm,
  statusFilter,
  privacyMode,
  onEdit,
  onDelete
}: ProductionGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {productions.map((production) => (
        <div
          key={production.id}
          onClick={() => onEdit(production)}
          className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-50 mb-2 group-hover:text-slate-100 transition-colors">
                {production.title}
              </h3>
              <Badge className={`${statusColors[production.status as ProductionStatus]} text-white`}>
                {statusLabels[production.status as ProductionStatus]}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(production);
                  }}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-400/80 opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Edit className="h-4 w-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center text-sm text-slate-400">
              <Calendar className="h-4 w-4 mr-2" />
              {production.deadline ? new Date(production.deadline).toLocaleDateString('pt-BR') : '--'}
            </div>

            <div className="flex items-center text-sm text-slate-400 font-semibold uppercase">
              <CreditCard className="h-4 w-4 mr-2" />
              {production.payment_method ? paymentMethodLabels[production.payment_method] || production.payment_method : '--'}
            </div>

            <div className="flex items-center text-sm text-slate-400">
              <DollarSign className="h-4 w-4 mr-2" />
              <span className={`transition-all duration-700 ${privacyMode ? 'blur-md pointer-events-none select-none' : ''}`}>
                {formatCurrency(production.total_value)}
              </span>
            </div>

            {production.profit !== 0 && (
              <div className="flex items-center text-sm text-emerald-400">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className={`transition-all duration-700 ${privacyMode ? 'blur-md pointer-events-none select-none' : ''}`}>
                  {formatCurrency(production.profit)}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
