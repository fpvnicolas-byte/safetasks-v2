'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, X } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { servicesApi, productionsApi } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/utils';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';

interface ItemsTabProps {
  selectedProduction: any;
  services: any[];
  selectedService: any;
  newItemQuantity: number;
  onServicesChange: (services: any[]) => void;
  onSelectedServiceChange: (service: any) => void;
  onNewItemQuantityChange: (quantity: number) => void;
  onFetchServices: () => Promise<void>;
  onUpdateSelectedProduction: (production: any) => void;
}

export function ItemsTab({
  selectedProduction,
  services,
  selectedService,
  newItemQuantity,
  onServicesChange,
  onSelectedServiceChange,
  onNewItemQuantityChange,
  onFetchServices,
  onUpdateSelectedProduction
}: ItemsTabProps) {
  const { mutate } = useSWRConfig();

  const handleAddItem = async () => {
    if (!selectedService || !selectedProduction) return;

    try {
      const itemData = {
        service_id: selectedService.id,
        quantity: newItemQuantity,
      };

      await productionsApi.addProductionItem(selectedProduction.id, itemData);

      // Atualizar produção e dados financeiros
      await mutate('/api/v1/productions');

      // Buscar produção atualizada para atualizar o estado local
      const response = await productionsApi.getProductions();
      const updatedProduction = response.productionsList.find((p: any) => p.id === selectedProduction.id);
      if (updatedProduction) {
        onUpdateSelectedProduction(updatedProduction);
      }

      // Reset form
      onSelectedServiceChange(null);
      onNewItemQuantityChange(1);
      toast.success('Item adicionado com sucesso!');
    } catch (err: any) {
      console.error("Erro ao adicionar item:", err);
      if (err.response?.status === 500) {
        toast.error("Erro de sincronização, atualizando...");
      } else {
        toast.error(err.response?.data?.detail || 'Erro ao adicionar item');
      }
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!selectedProduction) return;

    try {
      await productionsApi.deleteProductionItem(selectedProduction.id, itemId);

      // Atualizar produção e dados financeiros
      await mutate('/api/v1/productions');

      // Buscar produção atualizada para atualizar o estado local
      const response = await productionsApi.getProductions();
      const updatedProduction = response.productionsList.find((p: any) => p.id === selectedProduction.id);
      if (updatedProduction) {
        onUpdateSelectedProduction(updatedProduction);
      }

      toast.success('Item removido com sucesso!');
    } catch (err: any) {
      console.error("Erro ao remover item:", err);
      toast.error('Erro ao remover item');
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário para adicionar itens */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
        <h4 className="text-sm font-medium text-slate-50 mb-4">Adicionar Serviço</h4>
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
              onClick={handleAddItem}
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
        {selectedProduction.items && selectedProduction.items.length > 0 ? (
          selectedProduction.items.map((item: any) => (
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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono font-bold text-slate-50">
                    {formatCurrency(item.total_price)}
                  </p>
                  <Button
                    onClick={() => handleRemoveItem(item.id)}
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
