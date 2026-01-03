import React from 'react';

interface CardListItemProps {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  price?: number;
  category?: string;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  privacyMode?: boolean;
}

interface CardListProps {
  items: CardListItemProps[];
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onAdd?: () => void;
  addButtonText?: string;
}

export function CardListItem({
  id,
  title,
  subtitle,
  description,
  price,
  category,
  onEdit,
  onDelete,
  privacyMode = false
}: CardListItemProps) {
  // Mantém a formatação com ponto de milhar (ex: 1.000,00)
  const formatBRL = (valueInCents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valueInCents / 100);
  };

  return (
    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-50 mb-1 group-hover:text-blue-400 transition-colors tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">{subtitle}</p>
          )}
          {category && (
            <span className="inline-block bg-blue-500/10 text-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-500/20">
              {category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Editar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="p-2 text-red-400/70 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
              title="Excluir"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {description && (
        <p className="text-sm text-slate-400/80 mb-6 leading-relaxed border-l-2 border-white/5 pl-3">{description}</p>
      )}

      {price !== undefined && (
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          {/* AQUI ESTÁ A CORREÇÃO: Texto maior e em negrito */}
          <span className="text-lg font-bold text-slate-200">Preço base:</span>
          
          {/* Valor base agora mais discreto em comparação ao label */}
          <span className={`text-l font-bold text-emerald-400 tracking-tight transition-all duration-700 ${privacyMode ? 'blur-md grayscale pointer-events-none select-none' : ''}`}>
            {formatBRL(price)}
          </span>
        </div>
      )}
    </div>
  );
}

export function CardList({
  items,
  emptyMessage = "Nenhum item cadastrado",
  emptyIcon,
  onAdd,
  addButtonText = "Novo Item"
}: CardListProps) {
  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        items.map((item) => (
          <CardListItem key={item.id} {...item} />
        ))
      ) : (
        <div className="text-center py-12">
          {emptyIcon && (
            <div className="mx-auto mb-4 text-slate-500">
              {emptyIcon}
            </div>
          )}
          <p className="text-slate-400 text-lg mb-2">{emptyMessage}</p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:text-slate-100 transition-colors"
            >
              {addButtonText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
