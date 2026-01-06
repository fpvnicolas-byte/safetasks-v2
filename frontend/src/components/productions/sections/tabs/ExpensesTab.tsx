'use client';

import { FileText, Plus, X } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { productionsApi } from './src/lib/api';
import { formatCurrency } from './src/lib/utils';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';

interface ExpensesTabProps {
  selectedProduction: any;
  newExpenseName: string;
  newExpenseValue: number;
  newExpenseCategory: string;
  onNewExpenseNameChange: (name: string) => void;
  onNewExpenseValueChange: (value: number) => void;
  onNewExpenseCategoryChange: (category: string) => void;
  onUpdateSelectedProduction: (production: any) => void;
}

export function ExpensesTab({
  selectedProduction,
  newExpenseName,
  newExpenseValue,
  newExpenseCategory,
  onNewExpenseNameChange,
  onNewExpenseValueChange,
  onNewExpenseCategoryChange,
  onUpdateSelectedProduction
}: ExpensesTabProps) {
  const { mutate } = useSWRConfig();

  const handleAddExpense = async () => {
    if (!selectedProduction || !newExpenseName.trim() || newExpenseValue <= 0) return;

    try {
      const expenseData = {
        name: newExpenseName.trim(),
        value: Math.round(newExpenseValue * 100), // Converter para centavos
        category: newExpenseCategory || null,
      };

      await productionsApi.addExpense(selectedProduction.id, expenseData);

      // Atualizar produção e dados financeiros
      await mutate('/api/v1/productions');

      // Buscar produção atualizada para atualizar o estado local
      const response = await productionsApi.getProductions();
      const updatedProduction = response.productionsList.find((p: any) => p.id === selectedProduction.id);
      if (updatedProduction) {
        onUpdateSelectedProduction(updatedProduction);
      }

      // Reset form
      onNewExpenseNameChange('');
      onNewExpenseValueChange(0);
      onNewExpenseCategoryChange('');
      toast.success('Despesa adicionada com sucesso!');
    } catch (err: any) {
      console.error("Erro ao adicionar despesa:", err);
      if (err.response?.status === 500) {
        toast.error("Erro de sincronização, atualizando...");
      } else {
        toast.error(err.response?.data?.detail || 'Erro ao adicionar despesa');
      }
    }
  };

  const handleRemoveExpense = async (expenseId: number) => {
    if (!selectedProduction) return;

    try {
      await productionsApi.removeExpense(selectedProduction.id, expenseId);

      await mutate('/api/v1/productions');

      // Buscar produção atualizada para atualizar o estado local
      const response = await productionsApi.getProductions();
      const updatedProduction = response.productionsList.find((p: any) => p.id === selectedProduction.id);
      if (updatedProduction) {
        onUpdateSelectedProduction(updatedProduction);
      }

      toast.success('Despesa removida com sucesso!');
    } catch (err: any) {
      console.error("Erro ao remover despesa:", err);
      toast.error('Erro ao remover despesa');
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário para adicionar despesas */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
        <h4 className="text-sm font-medium text-slate-50 mb-4">Adicionar Despesa</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              value={newExpenseName}
              onChange={(e) => onNewExpenseNameChange(e.target.value)}
              placeholder="Nome da despesa"
              className="bg-slate-900/50 border-slate-700"
            />
          </div>
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">R$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newExpenseValue}
                onChange={(e) => {
                  const value = e.target.value;
                  const parsedValue = parseFloat(value);
                  onNewExpenseValueChange(isNaN(parsedValue) ? 0 : parsedValue);
                }}
                placeholder="Valor"
                className="bg-slate-900/50 border-slate-700 pl-8"
              />
            </div>
          </div>
          <div>
            <Select
              value={newExpenseCategory}
              onValueChange={onNewExpenseCategoryChange}
            >
              <SelectTrigger className="bg-slate-900/50 border-slate-700">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="Alimentação">Alimentação</SelectItem>
                <SelectItem value="Transporte">Transporte</SelectItem>
                <SelectItem value="Locação">Locação</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Button
              onClick={handleAddExpense}
              disabled={!newExpenseName.trim() || newExpenseValue <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Despesa
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de despesas */}
      <div className="space-y-4">
        {selectedProduction.expenses && selectedProduction.expenses.length > 0 ? (
          <>
            {selectedProduction.expenses.map((expense: any) => (
              <div key={expense.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-slate-400 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-slate-50">{expense.name}</h4>
                      <p className="text-xs text-slate-400">
                        Categoria: {expense.category || 'Não especificada'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono font-bold text-slate-50">
                      {formatCurrency(expense.value)}
                    </p>
                    <Button
                      onClick={() => handleRemoveExpense(expense.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Total das Despesas */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-slate-400 mr-3" />
                  <h4 className="text-sm font-medium text-slate-50">Total das Despesas</h4>
                </div>
                <div className="text-right">
                  <p className="text-lg font-mono font-bold text-slate-50">
                    {formatCurrency(selectedProduction.expenses.reduce((total: number, expense: any) => total + expense.value, 0))}
                  </p>
                  <p className="text-xs text-slate-400">
                    {selectedProduction.expenses.length} despesa{selectedProduction.expenses.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-500">Nenhuma despesa cadastrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
