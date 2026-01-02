'use client';

import React from 'react';
import { Plus, Edit, Search, Filter, X, Save, Calendar, MapPin, CreditCard, DollarSign, TrendingUp, Users, Package, User, FileText, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

// Interfaces baseadas nos schemas do backend
interface ProductionCrewMember {
  id: number;
  user_id: number;
  full_name: string | null;
  role: string;
  fee: number | null;
}

interface ProductionItem {
  id: number;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ProductionExpense {
  id: number;
  name: string;
  value: number;
  category: string | null;
  paid_by: string | null;
}

interface Client {
  id: number;
  full_name: string;
  email?: string;
  cnpj?: string;
  phone?: string;
}

interface Production {
  id: number;
  title: string;
  status: string;
  deadline: string | null;
  locations: string | null;
  filming_dates: string | null;
  priority: string | null;
  payment_method: string | null;
  payment_status: string;
  due_date: string | null;
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total_value: number;
  total_cost: number;
  profit: number;
  client?: Client;
  crew: ProductionCrewMember[];
  items: ProductionItem[];
  expenses: ProductionExpense[];
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
  draft: 'bg-gray-500',
  proposal_sent: 'bg-yellow-500',
  approved: 'bg-blue-500',
  in_progress: 'bg-orange-500',
  completed: 'bg-green-500',
  canceled: 'bg-red-500',
};

interface ProductionDetailsSheetProps {
  production: Production | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  onSave?: () => void;
  onCancel?: () => void;
  editForm?: any;
  onEditFormChange?: (field: string, value: any) => void;
  onAddLocation?: () => void;
  onRemoveLocation?: (index: number) => void;
  onUpdateLocation?: (index: number, value: string) => void;
  onAddFilmingDate?: () => void;
  onRemoveFilmingDate?: (index: number) => void;
  onUpdateFilmingDate?: (index: number, value: string) => void;
}

export default function ProductionDetailsSheet({
  production,
  isOpen,
  onOpenChange,
  isEditing = false,
  onEditingChange = () => {},
  onSave = () => {},
  onCancel = () => {},
  editForm = {},
  onEditFormChange = () => {},
  onAddLocation = () => {},
  onRemoveLocation = () => {},
  onUpdateLocation = () => {},
  onAddFilmingDate = () => {},
  onRemoveFilmingDate = () => {},
  onUpdateFilmingDate = () => {},
}: ProductionDetailsSheetProps) {
  if (!production) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl bg-slate-950/95 backdrop-blur-2xl border-l border-white/10">
        <SheetHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between w-full">
            <SheetTitle className="text-slate-50">
              {production.title}
            </SheetTitle>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)] pr-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-900/50">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
              <TabsTrigger value="items">Itens</TabsTrigger>
              <TabsTrigger value="crew">Equipe</TabsTrigger>
              <TabsTrigger value="expenses">Despesas</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cliente
                  </label>
                  <p className="text-slate-50">
                    {production.client?.full_name || 'Cliente não informado'}
                  </p>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Título
                  </label>
                  <p className="text-slate-50">{production.title}</p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status
                  </label>
                  <Badge className={`${statusColors[production.status as ProductionStatus]} text-white`}>
                    {statusLabels[production.status as ProductionStatus]}
                  </Badge>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Prazo
                  </label>
                  <p className="text-slate-50">
                    {production.deadline ? new Date(production.deadline).toLocaleDateString('pt-BR') : '--'}
                  </p>
                </div>

                {/* Locations */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Locais de Filmagem
                  </label>
                  <div className="space-y-1">
                    {production.locations ? (
                      production.locations.split(',').map((location, index) => (
                        <Badge key={index} variant="secondary" className="mr-2">
                          {location.trim()}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-slate-50">--</p>
                    )}
                  </div>
                </div>

                {/* Filming Dates */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Dias de Filmagem
                  </label>
                  <div className="space-y-1">
                    {production.filming_dates ? (
                      production.filming_dates.split(',').map((date, index) => (
                        <Badge key={index} variant="secondary" className="mr-2">
                          {new Date(date.trim()).toLocaleDateString('pt-BR')}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-slate-50">--</p>
                    )}
                  </div>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status do Pagamento
                  </label>
                  <Badge variant="secondary" className="capitalize">
                    {production.payment_status || 'Pendente'}
                  </Badge>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Método de Pagamento
                  </label>
                  <p className="text-slate-50">{production.payment_method || '--'}</p>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data de Vencimento
                  </label>
                  <p className="text-slate-50">
                    {production.due_date ? new Date(production.due_date).toLocaleDateString('pt-BR') : '--'}
                  </p>
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Desconto (R$)
                  </label>
                  <p className="text-slate-50">
                    {formatCurrency(production.discount)}
                  </p>
                </div>

                {/* Tax Rate */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Taxa de Imposto (%)
                  </label>
                  <p className="text-slate-50">
                    {production.tax_rate}%
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-6 mt-6">
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
                      {formatCurrency(production.subtotal)}
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
                      {formatCurrency(production.total_cost)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Equipe: {formatCurrency(production.crew?.reduce((total, member) => total + (member.fee || 0), 0) || 0)} +
                    </p>
                    <p className="text-xs text-slate-500">
                      Despesas: {formatCurrency(production.expenses?.reduce((total, expense) => total + expense.value, 0) || 0)}
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
                      {production.tax_rate}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-yellow-400">
                      {formatCurrency(production.tax_amount)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Sobre {formatCurrency(production.subtotal)}
                    </p>
                  </div>
                </div>

                {/* CARD: LUCRO LÍQUIDO - BAIXO DIREITO (DESTACADO) */}
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border-2 border-blue-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <TrendingUp className="h-6 w-6 text-blue-400 mr-3" />
                      <h3 className="text-sm font-medium text-blue-300">Lucro Líquido</h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className={`text-3xl font-bold ${production.profit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      {formatCurrency(production.profit)}
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
                  <span className={`font-mono font-bold ${production.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {production.subtotal > 0 ?
                      `${((production.profit / production.subtotal) * 100).toFixed(1)}%` :
                      '0%'
                    }
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="items" className="space-y-6 mt-6">
              <div className="space-y-4">
                {production.items && production.items.length > 0 ? (
                  production.items.map((item) => (
                    <div key={item.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-slate-400 mr-3" />
                          <div>
                            <h4 className="text-sm font-medium text-slate-50">{item.name}</h4>
                            <p className="text-xs text-slate-400">
                              Quantidade: {item.quantity} × {formatCurrency(item.unit_price)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-mono font-bold text-slate-50">
                          {formatCurrency(item.total_price)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-500">Nenhum item cadastrado</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="crew" className="space-y-6 mt-6">
              <div className="space-y-4">
                {production.crew && production.crew.length > 0 ? (
                  <>
                    {production.crew.map((member, index) => (
                      <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-slate-400 mr-3" />
                            <div>
                              <h4 className="text-sm font-medium text-slate-50">
                                {member.full_name || 'Nome não informado'}
                              </h4>
                              <p className="text-xs text-slate-400">{member.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.fee && (
                              <p className="text-sm font-mono font-bold text-slate-50">
                                {formatCurrency(member.fee)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Total da Equipe */}
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10 mt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-slate-400 mr-3" />
                          <h4 className="text-sm font-medium text-slate-50">Total da Equipe</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-mono font-bold text-slate-50">
                            {formatCurrency(production.crew.reduce((total, member) => total + (member.fee || 0), 0))}
                          </p>
                          <p className="text-xs text-slate-400">
                            {production.crew.length} membro{production.crew.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-500">Nenhum membro da equipe cadastrado</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="expenses" className="space-y-6 mt-6">
              <div className="space-y-4">
                {production.expenses && production.expenses.length > 0 ? (
                  <>
                    {production.expenses.map((expense) => (
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
                          <p className="text-sm font-mono font-bold text-slate-50">
                            {formatCurrency(expense.value)}
                          </p>
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
                            {formatCurrency(production.expenses.reduce((total, expense) => total + expense.value, 0))}
                          </p>
                          <p className="text-xs text-slate-400">
                            {production.expenses.length} despesa{production.expenses.length !== 1 ? 's' : ''}
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
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
