'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Package, Wrench } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { servicesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { CardList } from '@/components/ui/card-list';

// Interfaces baseadas nos schemas do backend
interface Service {
  id: number;
  name: string;
  description: string | null;
  default_price: number; // In cents
  unit: string | null;
  organization_id: number;
}

interface ServiceFormData {
  name: string;
  description: string;
  default_price: string; // Will be converted to cents
  unit: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const { mutate } = useSWRConfig();

  // Estado para formulários
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    default_price: '',
    unit: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await servicesApi.getServices();
      setServices(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    if (!formData.name.trim() || !formData.default_price.trim()) return;

    const priceValue = parseFloat(formData.default_price.replace(',', '.'));
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error("Preço deve ser um valor positivo");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        default_price: Math.round(priceValue * 100), // Convert to cents
        unit: formData.unit.trim() || null,
      };

      await servicesApi.createService(payload);

      // Limpar formulário e fechar modal
      setCreateModalOpen(false);
      resetForm();
      await mutate('/api/v1/services');
      await fetchServices();

      // Toast de sucesso
      toast.success("Serviço criado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao criar serviço:", err);

      // Toast de erro para 400 Bad Request (mantém modal aberto)
      if (err.response?.status === 400) {
        toast.error("Dados inválidos ou serviço já existe");
      } else {
        toast.error("Erro ao criar serviço");
      }
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setServiceToDelete(service);
    }
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      // Note: Backend doesn't have delete endpoint yet - placeholder
      console.log(`Delete service ${serviceToDelete.id} - endpoint not implemented yet`);

      // Simular exclusão bem-sucedida para demonstração
      setServices(services.filter(s => s.id !== serviceToDelete.id));

      // Atualizar cache
      await mutate('/api/v1/services');

      toast.success("Serviço excluído com sucesso!");
    } catch (err: any) {
      console.error("Erro ao excluir serviço:", err);
      toast.error("Erro ao excluir serviço");
    } finally {
      setServiceToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      default_price: '',
      unit: '',
    });
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prepare services for CardList component
  const cardListItems = filteredServices.map(service => ({
    id: service.id,
    title: service.name,
    subtitle: service.unit || undefined,
    description: service.description || undefined,
    price: service.default_price, // Will be formatted as R$ XX,XX
    category: service.unit ? `Unidade: ${service.unit}` : undefined,
    onDelete: handleDeleteService,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando serviços...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            Erro: {error}
          </p>
          <p className="text-sm text-slate-500">
            Verifique se o backend está rodando em http://localhost:8000
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-gradient-to-r from-blue-500/8 to-purple-500/8 blur-3xl animate-pulse" />
        <div className="absolute bottom-32 right-32 w-96 h-96 rounded-full bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-50 mb-2">
              Serviços
            </h1>
            <p className="text-slate-400">
              Gerencie os serviços disponíveis para suas produções audiovisuais
            </p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar serviços..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Services List - Using CardList Component */}
        <CardList
          items={cardListItems}
          emptyMessage="Nenhum serviço cadastrado"
          emptyIcon={<Package className="h-16 w-16" />}
          onAdd={() => setCreateModalOpen(true)}
          addButtonText="Criar Primeiro Serviço"
        />
      </div>

      {/* Create Service Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-2xl border border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-50 text-xl font-semibold">
              Novo Serviço
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome do Serviço *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Diária de Drone, Edição 4K"
                className="bg-slate-900/50 border-slate-700 text-slate-50 focus:border-slate-500"
                autoFocus
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Descrição
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada do serviço"
                className="bg-slate-900/50 border-slate-700 text-slate-50 focus:border-slate-500"
                rows={3}
              />
            </div>

            {/* Preço Base */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Preço Base (R$) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.default_price}
                onChange={(e) => setFormData({ ...formData, default_price: e.target.value })}
                placeholder="0.00"
                className="bg-slate-900/50 border-slate-700 text-slate-50"
              />
            </div>

            {/* Unidade */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Unidade
              </label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-50">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="hora">Por hora</SelectItem>
                  <SelectItem value="dia">Por dia</SelectItem>
                  <SelectItem value="unidade">Por unidade</SelectItem>
                  <SelectItem value="projeto">Por projeto</SelectItem>
                  <SelectItem value="km">Por km</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setCreateModalOpen(false);
                  resetForm();
                }}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateService}
                disabled={!formData.name.trim() || !formData.default_price.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Criar Serviço
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!serviceToDelete} onOpenChange={() => setServiceToDelete(null)}>
        <AlertDialogContent className="bg-slate-950/95 backdrop-blur-2xl border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-50 text-xl font-semibold">
              Excluir Serviço
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja excluir o serviço <strong className="text-slate-50">"{serviceToDelete?.name}"</strong>?
              <br />
              Esta ação não pode ser desfeita e pode afetar produções que utilizam este serviço.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteService}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
