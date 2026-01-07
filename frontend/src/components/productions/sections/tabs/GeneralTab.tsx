
'use client';

import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Plus, X } from 'lucide-react';
import { formatCurrency } from '../../../../lib/utils';

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

interface GeneralTabProps {
  selectedProduction: any;
  isEditing: boolean;
  editForm: {
    title: string;
    status: ProductionStatus;
    deadline: string;
    shooting_sessions: Array<{ date: string | null, location: string | null }>;
    payment_status: string;
    payment_method: string;
    due_date: string;
    discount: number;
    tax_rate: number;
    notes: string;
  };
  onEditFormChange: (updates: Partial<GeneralTabProps['editForm']>) => void;
  onAddShootingSession: () => void;
  onRemoveShootingSession: (index: number) => void;
  onUpdateShootingSessionDate: (index: number, value: string) => void;
  onUpdateShootingSessionLocation: (index: number, value: string) => void;
}

export function GeneralTab({
  selectedProduction,
  isEditing,
  editForm,
  onEditFormChange,
  onAddShootingSession,
  onRemoveShootingSession,
  onUpdateShootingSessionDate,
  onUpdateShootingSessionLocation
}: GeneralTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Cliente */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Cliente
        </label>
        <p className="text-slate-50">
          {selectedProduction.client?.full_name || 'Cliente não informado'}
        </p>
      </div>

      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Título
        </label>
        {isEditing ? (
          <Input
            value={editForm.title}
            onChange={(e) => onEditFormChange({ title: e.target.value })}
            className="bg-slate-900/50 border-slate-700"
          />
        ) : (
          <p className="text-slate-50">{selectedProduction.title}</p>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Status
        </label>
        {isEditing ? (
          <Select
            value={editForm.status}
            onValueChange={(value) => onEditFormChange({ status: value as ProductionStatus })}
          >
            <SelectTrigger className="bg-slate-900/50 border-slate-700">
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="proposal_sent">Proposta Enviada</SelectItem>
              <SelectItem value="approved">Aprovada</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="canceled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge className={`${statusColors[selectedProduction.status as ProductionStatus]} text-white`}>
            {statusLabels[selectedProduction.status as ProductionStatus]}
          </Badge>
        )}
      </div>

      {/* Deadline */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Prazo
        </label>
        {isEditing ? (
          <Input
            type="date"
            value={editForm.deadline}
            onChange={(e) => onEditFormChange({ deadline: e.target.value })}
            className="bg-slate-900/50 border-slate-700"
          />
        ) : (
          <p className="text-slate-50">
            {selectedProduction.deadline ? new Date(selectedProduction.deadline).toLocaleDateString('pt-BR') : '--'}
          </p>
        )}
      </div>

      {/* Shooting Sessions - Campos Dinâmicos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-300">
            Diárias de Filmagem
          </label>
          {isEditing && (
            <Button
              type="button"
              onClick={onAddShootingSession}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-300"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Diária
            </Button>
          )}
        </div>
        {isEditing ? (
          <div className="space-y-3">
            {editForm.shooting_sessions.map((session, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">
                    Diária {index + 1}
                  </span>
                  <Button
                    type="button"
                    onClick={() => onRemoveShootingSession(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Data</label>
                    <Input
                      type="date"
                      value={session.date ?? ""}
                      onChange={(e) => onUpdateShootingSessionDate(index, e.target.value)}
                      className="bg-slate-900/50 border-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Local</label>
                    <Input
                      value={session.location ?? ""}
                      onChange={(e) => onUpdateShootingSessionLocation(index, e.target.value)}
                      placeholder="Ex: Centro, Praia..."
                      className="bg-slate-900/50 border-slate-700 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
            {editForm.shooting_sessions.length === 0 && (
              <p className="text-sm text-slate-500 italic text-center py-4">
                Nenhuma diária adicionada
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {selectedProduction.shooting_sessions && selectedProduction.shooting_sessions.length > 0 ? (
              selectedProduction.shooting_sessions.map((session: any, index: number) => (
                <div key={index} className="bg-slate-800/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-50">
                      {session.date ? new Date(session.date).toLocaleDateString("pt-BR") : "Data não definida"}
                    </span>
                    {session.location && (
                      <>
                        <span className="text-slate-400">-</span>
                        <span className="text-sm text-slate-300">{session.location}</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-4">
                Nenhuma diária cadastrada
              </p>
            )}
          </div>
        )}
      </div>

      {/* Payment Status */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Status do Pagamento
        </label>
        {isEditing ? (
          <Select
            value={editForm.payment_status}
            onValueChange={(value) => onEditFormChange({ payment_status: value })}
          >
            <SelectTrigger className="bg-slate-900/50 border-slate-700">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="overdue">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <p className="text-slate-50">--</p>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Método de Pagamento
        </label>
        {isEditing ? (
          <Select
            value={editForm.payment_method}
            onValueChange={(value) => onEditFormChange({ payment_method: value })}
          >
            <SelectTrigger className="bg-slate-900/50 border-slate-700">
              <SelectValue placeholder="Selecione o método" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="credit">Crédito</SelectItem>
              <SelectItem value="debit">Débito</SelectItem>
              <SelectItem value="link">Link</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
              <SelectItem value="boleto">Boleto</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <p className="text-slate-50">{selectedProduction.payment_method || '--'}</p>
        )}
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Data de Vencimento
        </label>
        {isEditing ? (
          <Input
            type="date"
            value={editForm.due_date}
            onChange={(e) => onEditFormChange({ due_date: e.target.value })}
            className="bg-slate-900/50 border-slate-700"
          />
        ) : (
          <p className="text-slate-50">
            {selectedProduction.due_date ? new Date(selectedProduction.due_date).toLocaleDateString('pt-BR') : '--'}
          </p>
        )}
      </div>

      {/* Discount */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Desconto (R$)
        </label>
        {isEditing ? (
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">R$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={editForm.discount}
              onChange={(e) => {
                const value = e.target.value;
                const parsedValue = parseFloat(value);
                onEditFormChange({ discount: isNaN(parsedValue) ? 0 : parsedValue });
              }}
              onBlur={(e) => {
                if (editForm.discount < 0) {
                  onEditFormChange({ discount: 0 });
                } else if (editForm.discount > 0 && editForm.discount < 1) {
                  onEditFormChange({ discount: 1 });
                }
              }}
              className="bg-slate-900/50 border-slate-700 pl-8"
              placeholder="0.00"
            />
          </div>
        ) : (
          <p className="text-slate-50">
            {formatCurrency(selectedProduction.discount)}
          </p>
        )}
      </div>

      {/* Tax Rate */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Taxa de Imposto (%)
        </label>
        {isEditing ? (
          <div className="relative">
            <Input
              type="number"
              step="1"
              min="0"
              max="100"
              value={editForm.tax_rate}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // Remove any non-numeric characters
                const parsedValue = parseInt(value) || 0;
                onEditFormChange({ tax_rate: parsedValue });
              }}
              className="bg-slate-900/50 border-slate-700 pr-8"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">%</span>
          </div>
        ) : (
          <p className="text-slate-50">{selectedProduction.tax_rate}%</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Observações
        </label>
        {isEditing ? (
          <textarea
            value={editForm.notes || ""}
            onChange={(e) => onEditFormChange({ notes: e.target.value })}
            className="w-full h-24 bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
            placeholder="Digite observações sobre esta produção..."
          />
        ) : (
          <div className="min-h-24 bg-slate-800/30 rounded-md p-3">
            <p className="text-slate-50 whitespace-pre-wrap">
              {selectedProduction.notes || "Nenhuma observação cadastrada"}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
