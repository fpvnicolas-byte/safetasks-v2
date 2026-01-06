'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Package, Wrench, Coins } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { servicesApi } from '../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { CardList } from '../../../components/ui/card-list';
import { usePrivacy } from '../layout';

// Interface com tipagem rigorosa
interface Service {
  id: number;
  name: string;
  description: string | null;
  default_price: number; // Centavos vindos do backend
  unit: string | null;
  organization_id: number;
}

interface ServiceFormData {
  name: string;
  description: string;
  default_price: string;
  unit: string;
}

export default function ServicesPage() {
  const { privacyMode } = usePrivacy();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const { mutate } = useSWRConfig();

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
        default_price: Math.round(priceValue * 100),
        unit: formData.unit.trim() || null,
      };

      await servicesApi.createService(payload);
      setCreateModalOpen(false);
      resetForm();
      await fetchServices();
      toast.success("Serviço criado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao criar serviço");
    }
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      await servicesApi.deleteService(serviceToDelete.id);
      setServices(services.filter(s => s.id !== serviceToDelete.id));
      toast.success("Serviço excluído com sucesso!");
    } catch (err: any) {
      const detail = err.response?.data?.detail || "";
      if (detail.includes("used in productions")) {
        toast.error("Não é possível excluir: serviço vinculado a uma produção");
      } else {
        toast.error("Erro ao excluir serviço");
      }
    } finally {
      setServiceToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', default_price: '', unit: '' });
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mapeamento visual para o CardList
  const cardListItems = filteredServices.map(service => ({
    id: service.id,
    title: service.name,
    subtitle: service.unit ? `Faturamento por ${service.unit}` : 'Preço fixo',
    description: service.description || 'Nenhuma descrição técnica informada',
    price: service.default_price, // CardList deve tratar o Intl.NumberFormat
    category: "Recurso Audiovisual",
    icon: <Wrench className="h-5 w-5 text-blue-400" />,
    onDelete: () => setServiceToDelete(service),
    privacyMode,
  }));

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400">Sincronizando catálogo...</div>;

  return (
    <div className="p-6 space-y-8 relative min-h-screen">
      {/* Visual background cleanup */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-50 tracking-tight">Catálogo de Serviços</h1>
            <p className="text-slate-400 mt-2 text-lg">Defina preços base para suas propostas comerciais</p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} 
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none bg-slate-800 hover:bg-slate-700 border border-slate-600 text-primary-foreground h-9 px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            Novo Serviço
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-md mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <Input 
            placeholder="Procurar serviço..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl text-slate-50 placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
          />
        </div>

        <CardList
          items={cardListItems}
          emptyMessage="Seu catálogo está vazio"
          onAdd={() => setCreateModalOpen(true)}
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
                step="1" // Força o incremento de 1 em 1 real nas setinhas
                min="1"  // Impede que o navegador aceite menos de 1 via setas
                value={formData.default_price}
                onChange={(e) => {
                  const val = e.target.value;
                  // Impede digitar valores negativos ou zero começando com "-" ou "0"
                  if (val === "" || parseFloat(val) >= 1) {
                    setFormData({ ...formData, default_price: val });
                  }
                }}
                placeholder="1.00"
                className="bg-slate-900/50 border-slate-700 text-slate-50 focus:border-slate-500"
              />
              <p className="text-[10px] text-slate-500 mt-1 italic">Valor mínimo: R$ 1,00</p>
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
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                Criar Serviço
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete - Corrigido para AlertDialogContent */}
      <AlertDialog open={!!serviceToDelete} onOpenChange={() => setServiceToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-slate-50 rounded-3xl backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Excluir Serviço?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-base">
              Você está prestes a remover <span className="text-white font-semibold">"{serviceToDelete?.name}"</span> do catálogo. 
              Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 mt-4">
            <AlertDialogCancel className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white rounded-xl">
              Manter
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteService} 
              className="bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}