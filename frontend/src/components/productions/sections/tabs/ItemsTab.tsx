
'use client';

import { Package, Plus, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { formatCurrency } from '../../../../lib/utils';
import { ProductionItemResponse, ServiceResponse } from '../ProductionEditSheet'; // Import types from parent

interface ItemsTabProps {
  items: ProductionItemResponse[]; // Receives the local state from parent (including negative IDs)
  services: ServiceResponse[]; // Options for the select
  selectedService: ServiceResponse | null; // Local state of parent for current selection
  newItemQuantity: number; // Local state of parent for new item quantity
  onSelectedServiceChange: (service: ServiceResponse | null) => void; // Parent setter
  onNewItemQuantityChange: (quantity: number) => void; // Parent setter
  onFetchServices: () => Promise<void>; // Parent fetcher
  onAddItem: (service: ServiceResponse, quantity: number) => void; // Parent handler
  onRemoveItem: (itemId: number) => void; // Parent handler
}

export function ItemsTab({
  items,
  services,
  selectedService,
  newItemQuantity,
  onSelectedServiceChange,
  onNewItemQuantityChange,
  onFetchServices,
  onAddItem,
  onRemoveItem
}: ItemsTabProps) {

  return (
    <div className="space-y-6">
      {/* Formulário para adicionar itens */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-4 w-4 text-slate-400" />
          <h4 className="text-sm font-medium text-slate-50">Adicionar Serviço</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select
              value={selectedService?.id ? selectedService.id.toString() : ''}
              onValueChange={(value) => {
                const service = services.find(s => s.id === parseInt(value));
                onSelectedServiceChange(service || null);
              }}
              onOpenChange={(open) => {
                if (open && services.length === 0) {
                  onFetchServices();
                }
              }}
            >
              <SelectTrigger className="bg-slate-900/50 border-slate-700">
                <SelectValue placeholder="Selecionar serviço" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {services.length > 0 ? (
                  services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name} - {formatCurrency(service.default_price || 0)}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-slate-400">
                    Nenhum serviço cadastrado.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              type="number"
              min="1"
              value={newItemQuantity}
              onChange={(e) => onNewItemQuantityChange(parseInt(e.target.value) || 1)}
              onBlur={(e) => {
                const value = parseInt(e.target.value.toString());
                if (isNaN(value) || value < 1) {
                  onNewItemQuantityChange(1);
                }
              }}
              placeholder="Quantidade"
              className="bg-slate-900/50 border-slate-700"
            />
          </div>
          <div>
            <Button
              onClick={() => onAddItem(selectedService as ServiceResponse, newItemQuantity)}
              disabled={!selectedService}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de itens */}
      <div className="space-y-4">
        {items && items.length > 0 ? (
          items.map((item: ProductionItemResponse, index: number) => (
            <div 
              key={item.id > 0 ? `item-${item.id}` : `temp-item-${index}-${item.name}`}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono font-bold text-slate-50">
                    {formatCurrency(item.total_price)}
                  </p>
                  <Button
                    onClick={() => onRemoveItem(item.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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
    </div>
  );
}
