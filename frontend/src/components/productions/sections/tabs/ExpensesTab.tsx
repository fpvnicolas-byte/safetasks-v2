
'use client';

import { FileText, Plus, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { formatCurrency } from '../../../../lib/utils';

// Import the ExpenseResponse type from parent component
interface ExpenseResponse {
  id: number;
  production_id?: number;
  name: string;
  value: number;
  category: string;
  paid_by?: string;
}

interface ExpensesTabProps {
  expenses: ExpenseResponse[]; // Receives the local state from parent (including negative IDs)
  newExpenseName: string;
  newExpenseValue: number;
  newExpenseCategory: string;
  onNewExpenseNameChange: (name: string) => void;
  onNewExpenseValueChange: (value: number) => void;
  onNewExpenseCategoryChange: (category: string) => void;
  onAddExpense: (name: string, value: number, category: string) => void; // Parent handler
  onRemoveExpense: (expenseId: number) => void; // Parent handler
}

export function ExpensesTab({
  expenses,
  newExpenseName,
  newExpenseValue,
  newExpenseCategory,
  onNewExpenseNameChange,
  onNewExpenseValueChange,
  onNewExpenseCategoryChange,
  onAddExpense,
  onRemoveExpense
}: ExpensesTabProps) {
  // Removed direct API calls - now uses local state management like other tabs

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
              onClick={() => onAddExpense(newExpenseName, newExpenseValue, newExpenseCategory)}
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
        {expenses && expenses.length > 0 ? (
          <>
            {expenses.map((expense: ExpenseResponse, index: number) => (
              <div
                key={expense.id > 0 ? `expense-${expense.id}` : `temp-expense-${index}-${expense.name}`}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
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
                      onClick={() => onRemoveExpense(expense.id)}
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
                    {formatCurrency(expenses.reduce((total: number, expense: ExpenseResponse) => total + (expense.value || 0), 0))}
                  </p>
                  <p className="text-xs text-slate-400">
                    {expenses.length} despesa{expenses.length !== 1 ? 's' : ''}
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
