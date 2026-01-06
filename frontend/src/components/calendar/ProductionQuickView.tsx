'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Film, DollarSign, Flag, MapPin, Users, Calendar, Clock, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useDesignTokens } from '../lib/hooks/use-design-tokens';

const paymentMethodLabels: Record<string, string> = {
  pix: 'PIX',
  credit: 'Crédito',
  debit: 'Débito',
  link: 'Link',
  crypto: 'Crypto',
  boleto: 'Boleto',
};

interface Production {
  id: number;
  title: string;
  shooting_sessions: Array<{
    date: string;
    location: string;
  }> | null;
  deadline: string | null;
  due_date: string | null;
  payment_method: string | null;
  payment_status: string;
  total_value: number;
  notes: string | null;
  crew: Array<{
    id: number;
    user_id: number;
    full_name: string | null;
    role: string;
    fee: number | null;
  }>;
}

interface ProductionQuickViewProps {
  production: Production | null;
  eventType: 'filming' | 'payment' | 'deadline' | null;
  eventDate: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEditComplete: () => void;
}

export default function ProductionQuickView({
  production,
  eventType,
  eventDate,
  isOpen,
  onClose,
  onEditComplete,
}: ProductionQuickViewProps) {
  const { colors, spacing, borderRadius, shadows, transitions, glassEffect } = useDesignTokens();

  if (!production || !eventType || !eventDate) return null;

  const getEventIcon = () => {
    switch (eventType) {
      case 'filming':
        return <Film className="h-5 w-5 text-blue-400" />;
      case 'deadline':
        return <Flag className="h-5 w-5 text-orange-400" />;
      case 'payment':
        return <DollarSign className="h-5 w-5 text-green-400" />;
      default:
        return null;
    }
  };

  const getEventColor = () => {
    switch (eventType) {
      case 'filming':
        return 'bg-blue-500/20 border-blue-500/50';
      case 'deadline':
        return 'bg-orange-500/20 border-orange-500/50';
      case 'payment':
        return 'bg-green-500/20 border-green-500/50';
      default:
        return 'bg-slate-500/20 border-slate-500/50';
    }
  };

  const getEventTitle = () => {
    switch (eventType) {
      case 'filming':
        return 'Dia de Filmagem';
      case 'deadline':
        return 'Prazo de Entrega';
      case 'payment':
        return 'Dia de Pagamento';
      default:
        return 'Evento';
    }
  };

  const renderEventSpecificContent = () => {
    switch (eventType) {
      case 'filming':
        // Encontrar a sessão específica desta data
        const currentSession = production.shooting_sessions?.find(session => session.date === eventDate);

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-300">Local de Filmagem</p>
                <p className="text-sm text-slate-50">
                  {currentSession?.location || 'Local não especificado'}
                </p>
              </div>
            </div>

            <div className="border-t border-white/10" />

            <div>
              <p className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Equipe Presente
              </p>
              <div className="space-y-2">
                {production.crew && production.crew.length > 0 ? (
                  production.crew.slice(0, 3).map((member) => (
                    <div key={member.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                      <div>
                        <p className="text-sm font-medium text-slate-50">
                          {member.full_name || 'Nome não informado'}
                        </p>
                        <p className="text-xs text-slate-400">{member.role}</p>
                      </div>
                      {member.fee && (
                        <Badge variant="secondary" className="text-xs">
                          {formatCurrency(member.fee)}
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic">Nenhuma equipe definida</p>
                )}
              </div>
              {production.crew && production.crew.length > 3 && (
                <p className="text-xs text-slate-500 mt-1">
                  +{production.crew.length - 3} membros adicionais
                </p>
              )}
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-slate-300">Valor Total</p>
                <p className="text-lg font-bold text-emerald-400">
                  {formatCurrency(production.total_value)}
                </p>
              </div>
            </div>

            <div className="border-t border-white/10" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1">Método</p>
                <Badge variant="outline" className="text-xs">
                  {production.payment_method ? paymentMethodLabels[production.payment_method] || production.payment_method : 'Não especificado'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1">Status</p>
                <Badge
                  variant={production.payment_status === 'paid' ? 'default' : 'secondary'}
                  className={`text-xs ${production.payment_status === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-yellow-500/20 text-yellow-300'
                    }`}
                >
                  {production.payment_status === 'paid' ? 'Pago' :
                    production.payment_status === 'pending' ? 'Pendente' :
                      production.payment_status === 'partially_paid' ? 'Parcial' : 'Atrasado'}
                </Badge>
              </div>
            </div>
          </div>
        );

      case 'deadline':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Flag className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-sm font-medium text-slate-300">Prazo de Entrega</p>
                <p className="text-sm text-slate-50">
                  {production.deadline ? new Date(production.deadline).toLocaleDateString('pt-BR') : 'Não definido'}
                </p>
              </div>
            </div>

            <div className="border-t border-white/10" />

            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Notas do Projeto</p>
              <div className="bg-white/5 rounded-lg p-3 min-h-[80px]">
                {production.notes ? (
                  <p className="text-sm text-slate-50 leading-relaxed">{production.notes}</p>
                ) : (
                  <p className="text-sm text-slate-500 italic">Nenhuma nota adicionada</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md"
        style={{
          backgroundColor: colors.glass.dark,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${colors.glass.border}`,
          borderRadius: borderRadius.xl,
          boxShadow: shadows.glass.strong,
        }}
      >
        <DialogHeader
          className="pb-4"
          style={{
            borderBottom: `1px solid ${colors.glass.border}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: getEventColor().includes('blue') ? colors.glass.light :
                  getEventColor().includes('orange') ? colors.warning[500] + '20' :
                    colors.success[500] + '20',
                border: `1px solid ${getEventColor().includes('blue') ? colors.primary[500] + '50' :
                  getEventColor().includes('orange') ? colors.warning[500] + '50' :
                    colors.success[500] + '50'}`,
              }}
            >
              {getEventIcon()}
            </div>
            <div>
              <DialogTitle
                className="text-lg"
                style={{
                  color: colors.slate[50],
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {production.title}
              </DialogTitle>
              <p
                className="text-sm flex items-center gap-2 mt-1"
                style={{
                  color: colors.slate[400],
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {getEventTitle()} • {new Date(eventDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {renderEventSpecificContent()}
        </div>

        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Fechar
          </Button>
          {/*<Button
            onClick={onEditComplete}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-50"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Editar Completo
          </Button>*/}
        </div>
      </DialogContent>
    </Dialog>
  );
}
