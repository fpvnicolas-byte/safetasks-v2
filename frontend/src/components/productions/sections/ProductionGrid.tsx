import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Calendar, CreditCard, DollarSign, TrendingUp, Trash2, Edit, Download, FileText, ChevronDown } from 'lucide-react';
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
  onDownloadBudget?: (production: Production) => void;
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
  onDelete,
  onDownloadBudget
}: ProductionGridProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isInsideDropdown = Array.from(dropdownRefs.current.values()).some(ref =>
        ref && ref.contains(target)
      );
      if (!isInsideDropdown) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {productions.map((production) => (
        <div
          key={production.id}
          onClick={() => onEdit(production)}
          className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 cursor-pointer group relative"
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
              {onDownloadBudget && (
                <div
                  className="relative"
                  ref={(el) => {
                    if (el) {
                      dropdownRefs.current.set(production.id.toString(), el);
                    } else {
                      dropdownRefs.current.delete(production.id.toString());
                    }
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      const isOpen = openDropdown === production.id.toString();
                      setOpenDropdown(isOpen ? null : production.id.toString());
                    }}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400 hover:bg-slate-800/50 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg"
                    aria-label={`Opções de download para ${production.title}`}
                    aria-expanded={openDropdown === production.id.toString()}
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {openDropdown === production.id.toString() && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="py-1">
                        <button
                          className="flex items-center w-full px-4 py-3 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800/70 transition-all duration-150 group"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(null);
                            onDownloadBudget(production);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-3 text-blue-400 group-hover:text-blue-300" />
                          <div className="text-left">
                            <div className="font-medium">Gerar Orçamento</div>
                            <div className="text-xs text-slate-400">PDF personalizado</div>
                          </div>
                        </button>
                      </div>
                      <div className="px-3 py-2 bg-slate-800/50 border-t border-slate-700/50">
                        <div className="flex items-center text-xs text-slate-400">
                          <ChevronDown className="h-3 w-3 mr-1 rotate-180" />
                          Mais opções em breve
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
