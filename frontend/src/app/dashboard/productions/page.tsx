
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { productionsApi, servicesApi, usersApi, clientsApi } from '../../../lib/api';
import { formatCurrency } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { LoadingButton } from '../../../components/ui/loading-button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { usePrivacy } from '../../../hooks/use-privacy';

// Componentes refatorados
import { ProductionHeader } from '../../../components/productions/sections/ProductionHeader';
import { ProductionFilters } from '../../../components/productions/sections/ProductionFilters';
import { ProductionEditSheet } from '../../../components/productions/sections/ProductionEditSheet';
import { ProductionGrid } from '../../../components/productions/sections/ProductionGrid';
import { ProductionCardSkeleton } from '../../../components/ui/production-card-skeleton';

// Interfaces from ProductionEditSheet (as a temporary workaround)
import { ProductionResponse, ProductionStatus, ClientResponse, ProductionItemResponse, ProductionCrewResponse, ExpenseResponse } from '../../../components/productions/sections/ProductionEditSheet';

// Simple Production interface for ProductionGrid component
interface ProductionForGrid {
  id: number | string;
  title: string;
  status: string; // Changed from ProductionStatus to string to match ProductionGrid.tsx
  deadline: string | null;
  payment_method: string | null;
  total_value: number;
  profit: number;
}

interface ProductionsResponse {
  productionsList: ProductionResponse[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export default function ProductionsPage() {
  const { privacyMode } = usePrivacy();
  const [productions, setProductions] = useState<ProductionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProduction, setSelectedProduction] = useState<ProductionResponse | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [productionToDelete, setProductionToDelete] = useState<ProductionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [hasMore, setHasMore] = useState(false);
  const [currentSkip, setCurrentSkip] = useState(0);
  const LIMIT = 50;

  const { mutate } = useSWRConfig();
  const router = useRouter();

  // Estados para criação de produção
  const [createForm, setCreateForm] = useState({
    title: '',
    client_id: '',
    status: '' as ProductionStatus | '',
    deadline: '',
  });
  const [clients, setClients] = useState<ClientResponse[]>([]); // Client type from backend schema

  useEffect(() => {
    fetchProductions(0);
  }, []);

  const fetchProductions = async (skip = 0) => {
    try {
      if (skip === 0) setLoading(true);

      const response: ProductionsResponse = await productionsApi.getProductions(skip, LIMIT);

      if (skip === 0) {
        setProductions(response.productionsList || []);
      } else {
        setProductions(prev => [...prev, ...(response.productionsList || [])]);
      }

      setHasMore(response.has_more);
      setCurrentSkip(skip);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar produções');
    } finally {
      setLoading(false);
    }
  };

  const refreshList = () => {
    fetchProductions(0);
  };

  const handleLoadMore = () => {
    fetchProductions(currentSkip + LIMIT);
  };

  const handleDeleteProduction = (production: ProductionResponse) => {
    setProductionToDelete(production);
  };

  const confirmDeleteProduction = async () => {
    if (!productionToDelete) return;
    setIsDeleting(true);
    try {
      await productionsApi.deleteProduction(productionToDelete.id);
      setProductions(productions.filter(p => p.id !== productionToDelete.id));
      await mutate('/api/v1/productions');
      toast.success("Produção excluída com sucesso!");
    } catch (err: any) {
      console.error("Erro ao excluir produção:", err);
      toast.error("Erro ao excluir produção");
    } finally {
      setIsDeleting(false);
      setProductionToDelete(null);
    }
  };

  const handleEdit = (production: ProductionResponse) => {
    setSelectedProduction(production);
    setSheetOpen(true);
  };

  // Função para criar nova produção
  const handleCreateProduction = async () => {
    if (!createForm.title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: createForm.title.trim(),
        deadline: createForm.deadline ? new Date(createForm.deadline).toISOString() : undefined,
      };

      // Adicionar campos opcionais apenas se preenchidos
      if (createForm.client_id) {
        payload.client_id = Number(createForm.client_id);
      }
      if (createForm.status) {
        payload.status = createForm.status;
      }

      await productionsApi.createProduction(payload);

      // Atualizar lista e limpar modal
      setCreateModalOpen(false);
      setCreateForm({
        title: '',
        client_id: '',
        status: '',
        deadline: '',
      });
      await mutate('/api/v1/productions');
      await refreshList(); // Use refreshList here
    } catch (err: any) {
      console.error("Erro ao criar produção:", err);
      setError(err.response?.data?.detail || 'Erro ao criar produção');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Buscar clientes quando necessário
  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients();
      setClients(response);
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
    }
  };

  const filteredProductions = productions.filter(production => {
    const matchesSearch = production.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || production.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Função para gerar orçamento PDF
  const handleGenerateBudget = async (production: ProductionResponse) => {
    try {
      toast.loading('Gerando orçamento...', { id: 'budget-generation' });

      const productionData = await productionsApi.getProduction(production.id);
      const budgetData = {
        client: productionData.client || {
          full_name: 'Cliente não informado',
          email: '',
          cnpj: '',
          phone: '',
          address: ''
        },
        production: {
          id: productionData.id,
          title: productionData.title || 'Produção sem título',
          status: productionData.status || 'draft',
          created_at: productionData.created_at,
          deadline: productionData.deadline
        },
        items: productionData.items || [],
        services: [], // Services are now fetched by ProductionEditSheet, not directly part of ProductionResponse
        total: productionData.total_value || 0,
        discount: productionData.discount || 0,
        tax: productionData.tax_amount || 0
      };

      const { generateBudgetPDF } = await import('../../../components/reports/BudgetGenerator');
      await generateBudgetPDF(budgetData);

      toast.success('Orçamento gerado com sucesso!', { id: 'budget-generation' });
    } catch (error: any) {
      toast.error('Erro ao gerar orçamento', { id: 'budget-generation' });
      console.error('Erro ao gerar orçamento:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-800 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-slate-800 rounded animate-pulse"></div>
        </div>

        {/* Filters Skeleton */}
        <div className="flex items-center gap-4">
          <div className="h-10 w-64 bg-slate-800 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-slate-800 rounded animate-pulse"></div>
        </div>

        {/* Production Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            Erro: {(error as any)?.detail?.[0]?.msg || (error as any)?.message || error || "Erro na operação"}
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
        <div
          className="absolute top-20 left-20 w-72 h-72 rounded-full bg-linear-to-r from-blue-500/8 to-purple-500/8 blur-3xl"
          style={{
            animation: 'smoothPulse 6s ease-in-out infinite',
            willChange: 'opacity, transform'
          }}
        />
        <div
          className="absolute bottom-32 right-32 w-96 h-96 rounded-full bg-linear-to-r from-emerald-500/5 to-cyan-500/5 blur-3xl"
          style={{
            animation: 'smoothPulse 6s ease-in-out infinite',
            animationDelay: '2s',
            willChange: 'opacity, transform'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <ProductionHeader
          onCreateClick={() => {
            setCreateModalOpen(true);
            fetchClients(); // Buscar clientes ao abrir modal
          }}
        />

        {/* Filters */}
        <ProductionFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {/* Production Grid */}
        <ProductionGrid
          productions={filteredProductions.map(p => ({
            id: p.id,
            title: p.title,
            status: p.status,
            deadline: p.deadline || null,
            payment_method: p.payment_method || null,
            total_value: p.total_value,
            profit: p.profit
          }))}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          privacyMode={privacyMode}
          onEdit={(production: ProductionForGrid) => {
            // Encontrar a produção completa na lista para passar para o sheet
            const fullProduction = productions.find(p => p.id === production.id);
            if (fullProduction) {
              handleEdit(fullProduction);
            }
          }}
          onDelete={(production: ProductionForGrid) => {
            // Encontrar a produção completa na lista para exclusão
            const fullProduction = productions.find(p => p.id === production.id);
            if (fullProduction) {
              handleDeleteProduction(fullProduction);
            }
          }}
          onDownloadBudget={(production: ProductionForGrid) => {
            // Encontrar a produção completa na lista para download do orçamento
            const fullProduction = productions.find(p => p.id === production.id);
            if (fullProduction) {
              handleGenerateBudget(fullProduction);
            }
          }}
        />

        {filteredProductions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Nenhuma produção encontrada' : 'Nenhuma produção cadastrada'}
            </p>
            <p className="text-slate-500 text-sm">
              {searchTerm || statusFilter !== 'all' ? 'Tente ajustar os filtros de busca' : 'Comece criando sua primeira produção'}
            </p>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !searchTerm && statusFilter === 'all' && (
          <div className="flex justify-center mt-8 pb-8">
            <Button
              onClick={handleLoadMore}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Carregar Mais Produções
            </Button>
          </div>
        )}
      </div>

      {/* Production Edit Sheet */}
      {selectedProduction && (
        <ProductionEditSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          production={selectedProduction}
          onUpdate={refreshList}
        />
      )}
      {/* Create Production Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-2xl border border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-50 text-xl font-semibold">
              Nova Produção
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Título da Produção *
              </label>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="Digite o título da produção"
                className="bg-slate-900/50 border-slate-700 text-slate-50 focus:border-slate-500"
                autoFocus
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cliente
              </label>
              <Select
                value={createForm.client_id}
                onValueChange={(value) => setCreateForm({ ...createForm, client_id: value })}
              >
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-50">
                  <SelectValue placeholder="Selecionar cliente (opcional)" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {clients.length > 0 ? (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.full_name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-slate-400">
                      Nenhum cliente encontrado
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Prazo */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Prazo
              </label>
              <Input
                type="date"
                value={createForm.deadline}
                onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
                className="bg-slate-900/50 border-slate-700 text-slate-50"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setCreateModalOpen(false)}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <LoadingButton
                onClick={handleCreateProduction}
                loading={isSubmitting}
                disabled={!createForm.title.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Criar Produção
              </LoadingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Production Confirmation Dialog */}
      <AlertDialog open={!!productionToDelete} onOpenChange={() => !isDeleting && setProductionToDelete(null)}>
        <AlertDialogContent className="bg-slate-950/95 backdrop-blur-2xl border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-50">
              Excluir Produção
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza de que deseja excluir a produção "{productionToDelete?.title}"?
              Esta ação não pode ser desfeita e todos os dados relacionados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Cancelar
            </AlertDialogCancel>
            <LoadingButton
              onClick={confirmDeleteProduction}
              loading={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir Produção
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
