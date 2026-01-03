'use client';

import { DollarSign, Package, FileText, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface FinancialTabProps {
  selectedProduction: any;
  isEditing: boolean;
}

export function FinancialTab({ selectedProduction, isEditing }: FinancialTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* CARD: FATURAMENTO (Receita) - TOPO ESQUERDO */}
        <div className="bg-slate-900/40 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-emerald-400 mr-3" />
              <h3 className="text-sm font-medium text-emerald-300">Faturamento</h3>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(selectedProduction.subtotal)}
            </p>
            <p className="text-xs text-slate-500">
              Receita bruta da produção
            </p>
          </div>
        </div>

        {/* CARD: CUSTOS TOTAIS - TOPO DIREITO */}
        <div className="bg-slate-900/40 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Package className="h-6 w-6 text-red-400 mr-3" />
              <h3 className="text-sm font-medium text-red-300">Custos Totais</h3>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-red-400">
              {formatCurrency(selectedProduction.total_cost)}
            </p>
            <p className="text-xs text-slate-500">
              Equipe: {formatCurrency(selectedProduction.crew?.reduce((total: number, member: any) => total + (member.fee || 0), 0) || 0)} +
            </p>
            <p className="text-xs text-slate-500">
              Despesas: {formatCurrency(selectedProduction.expenses?.reduce((total: number, expense: any) => total + expense.value, 0) || 0)}
            </p>
          </div>
        </div>

        {/* CARD: IMPOSTOS - BAIXO ESQUERDO */}
        <div className="bg-slate-900/40 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-yellow-400 mr-3" />
              <h3 className="text-sm font-medium text-yellow-300">Impostos</h3>
            </div>
            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
              {selectedProduction.tax_rate}%
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-yellow-400">
              {formatCurrency(selectedProduction.tax_amount)}
            </p>
            <p className="text-xs text-slate-500">
              Sobre {formatCurrency(selectedProduction.subtotal)}
            </p>
          </div>
        </div>

        {/* CARD: LUCRO LÍQUIDO - BAIXO DIREITO (DESTACADO) */}
        <div className="bg-linear-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border-2 border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-blue-400 mr-3" />
              <h3 className="text-sm font-medium text-blue-300">Lucro Líquido</h3>
            </div>
          </div>
          <div className="space-y-2">
            <p className={`text-3xl font-bold ${selectedProduction.profit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {formatCurrency(selectedProduction.profit)}
            </p>
            <p className="text-xs text-slate-500">
              Resultado final da produção
            </p>
          </div>
        </div>
      </div>

      {/* RESUMO EXECUTIVO */}
      <div className="bg-slate-900/20 rounded-xl p-4 border border-white/5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Margem de Lucro:</span>
          <span className={`font-mono font-bold ${selectedProduction.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {selectedProduction.subtotal > 0 ?
              `${((selectedProduction.profit / selectedProduction.subtotal) * 100).toFixed(1)}%` :
              '0%'
            }
          </span>
        </div>
      </div>
    </div>
  );
}
