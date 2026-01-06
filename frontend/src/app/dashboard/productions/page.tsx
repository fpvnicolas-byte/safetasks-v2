'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MapPin, Users, Package, User, FileText, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { productionsApi, servicesApi, usersApi, clientsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { usePrivacy } from '../layout';

// Componentes refatorados
import { ProductionHeader } from '../../../components/productions/sections/ProductionHeader';
import { ProductionFilters } from '../../../components/productions/sections/ProductionFilters';
import { ProductionEditSheet } from '../../../components/productions/sections/ProductionEditSheet';
import { ProductionGrid } from '../../../components/productions/sections/ProductionGrid';
import { ProductionCardSkeleton } from '../../../components/ui/production-card-skeleton';

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
  shooting_sessions: Array<{
    date: string;
    location: string;
  }> | null;
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
  notes: string | null;
  client?: Client;
  crew: ProductionCrewMember[];
  items: ProductionItem[];
  expenses: ProductionExpense[];
}

interface ProductionsResponse {
  productionsList: Production[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

type ProductionStatus = 'draft' | 'proposal_sent' | 'approved' | 'in_progress' | 'completed' | 'canceled';



export default function ProductionsPage() {
  const { privacyMode } = usePrivacy();
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [productionToDelete, setProductionToDelete] = useState<Production | null>(null);

  // Pagination state
  const [hasMore, setHasMore] = useState(false);
  const [currentSkip, setCurrentSkip] = useState(0);
  const LIMIT = 50;

  const { mutate } = useSWRConfig();
  const router = useRouter();

  // Estados para as abas dinâmicas
  const [services, setServices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newCrewRole, setNewCrewRole] = useState('');
  const [newCrewFee, setNewCrewFee] = useState(1);

  // Estados para despesas
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseValue, setNewExpenseValue] = useState(0);
  const [newExpenseCategory, setNewExpenseCategory] = useState('');

  // Estados para criação de produção
  const [createForm, setCreateForm] = useState({
    title: '',
    client_id: '',
    status: '' as ProductionStatus | '',
    deadline: '',
  });
  const [clients, setClients] = useState<any[]>([]);

  // Estado para edição
  const [editForm, setEditForm] = useState<{
    title: string;
    status: ProductionStatus;
    deadline: string;
    shooting_sessions: Array<{ date: string | null, location: string | null }>;
    payment_method: string;
    payment_status: string;
    due_date: string;
    subtotal: number;
    total_cost: number;
    discount: number;
    tax_rate: number;
    notes: string;
  }>({
    title: '',
    status: 'draft' as ProductionStatus,
    deadline: '',
    shooting_sessions: [] as Array<{ date: string | null, location: string | null }>,
    payment_method: '',
    payment_status: 'pending',
    due_date: '',
    subtotal: 0,
    total_cost: 0,
    discount: 0,
    tax_rate: 0,
    notes: '',
  });

  useEffect(() => {
    fetchProductions(0);
  }, []);

  // Buscar serviços e usuários quando necessário
  const fetchServices = async () => {
    try {
      const response = await servicesApi.getServices();
      setServices(response);
    } catch (err) {
      console.error("Erro ao buscar serviços:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getUsers();
      setUsers(response);
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
    }
  };

  // Funções para adicionar/remover itens
  const handleAddItem = async () => {
    if (!selectedService || !selectedProduction) return;

    try {
      // Payload correto baseado no schema ProductionItemCreate
      const itemData = {
        service_id: selectedService.id,
        quantity: newItemQuantity,
        // unit_price é opcional - se não fornecido, usa o default_price do serviço
      };



      await productionsApi.addProductionItem(selectedProduction.id, itemData);

      // Atualizar produção e dados financeiros
      await mutate('/api/v1/productions');

      // Buscar produção atualizada para atualizar o estado local
      const response: ProductionsResponse = await productionsApi.getProductions();
      const updatedProduction = response.productionsList.find((p: Production) => p.id === selectedProduction.id);
      if (updatedProduction) {
        setSelectedProduction(updatedProduction);
      }

      // Reset form
      setSelectedService(null);
      setNewItemQuantity(1);
    } catch (err: any) {
      console.error("Erro ao adicionar item:", err);
      console.error("Detalhes do erro:", err.response?.data);

      // Toast de erro para 500 Internal Server Error
      if (err.response?.status === 500) {
        toast.error("Erro de sincronização, atualizando...");
      } else {
        setError(err.response?.data?.detail || 'Erro ao adicionar item');
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
      const response: ProductionsResponse = await productionsApi.getProductions();
      const updatedProduction = response.productionsList.find((p: Production) => p.id === selectedProduction.id);
      if (updatedProduction) {
        setSelectedProduction(updatedProduction);
      }
    } catch (err: any) {
      console.error("Erro ao remover item:", err);
      setError(err.response?.data?.detail || 'Erro ao remover item');
    }
  };

  // Funções para adicionar/remover crew
  const handleAddCrewMember = async () => {
    if (!selectedUser || !selectedProduction) return;

    // Validações adicionais no frontend
    const feeValue = Number(newCrewFee);
    if (feeValue <= 0 || isNaN(feeValue)) {
      toast.error("O cachê deve ser maior que zero");
      return;
    }

    const roleValue = newCrewRole.trim();
    if (!roleValue) {
      toast.error("A função do membro deve ser informada");
      return;
    }

    try {
      // Garantir tipos corretos conforme schema ProductionCrewCreate
      const crewData = {
        user_id: Number(selectedUser.id),  // Garantir Integer
        role: roleValue.trim(),
        fee: Math.round(feeValue * 100),  // Garantir Integer em centavos
      };



      await productionsApi.addCrewMember(selectedProduction.id, crewData);

      // Limpar erro em caso de sucesso e executar mutate para atualizar a interface
      setError(null);
      await mutate('/api/v1/productions');

      // Buscar produção atualizada para atualizar o estado local
      const response: ProductionsResponse = await productionsApi.getProductions();
      const updatedProduction = response.productionsList.find((p: Production) => p.id === selectedProduction.id);
      if (updatedProduction) {
        setSelectedProduction(updatedProduction);
      }

      // Reset form
      setSelectedUser(null);
      setNewCrewRole('');
      setNewCrewFee(1);
    } catch (err: any) {
      console.error("Erro ao adicionar membro da equipe:", err);

      // Toast de erro para 500 Internal Server Error (mantém modal aberto)
      if (err.response?.status === 500) {
        toast.error("Erro de sincronização, atualizando...");
        // Não fecha modal para permitir nova tentativa
        // Sistema continua funcional
      } else {
        toast.error("Erro ao adicionar membro da equipe");
      }
    }
  };

  const handleRemoveCrewMember = async (userId: number) => {
    if (!selectedProduction) return;

    try {
      await productionsApi.removeCrewMember(selectedProduction.id, userId);

      // Atualizar produção e dados financeiros
      await mutate('/api/v1/productions');

      // Buscar produção atualizada para atualizar o estado local
      const response: ProductionsResponse = await productionsApi.getProductions();
      const updatedProduction = response.productionsList.find((p: Production) => p.id === selectedProduction.id);
      if (updatedProduction) {
        setSelectedProduction(updatedProduction);
      }
    } catch (err: any) {
      console.error("Erro ao remover membro da equipe:", err);
      setError(err.response?.data?.detail || 'Erro ao remover membro da equipe');
    }
  };

  // Funções para adicionar/remover despesas
  const handleAddExpense = async () => {
    if (!selectedProduction || !newExpenseName.trim() || newExpenseValue <= 0) return;

    try {
      const expenseData = {
        name: newExpenseName.trim(),
        value: Math.round(newExpenseValue * 100), // Converter para centavos
        category: newExpenseCategory || null,
      };

      await productionsApi.addExpense(selectedProduction.id, expenseData);

      // Atualizar produção e dados financeiros
      await mutate('/api/v1/productions');

      // Buscar produção atualizada para atualizar o estado local
      const response: ProductionsResponse = await productionsApi.getProductions();
      const updatedProduction = response.productionsList.find((p: Production) => p.id === selectedProduction.id);
      if (updatedProduction) {
        setSelectedProduction(updatedProduction);
      }

      // Reset form
      setNewExpenseName('');
      setNewExpenseValue(0);
      setNewExpenseCategory('');
    } catch (err: any) {
      console.error("Erro ao adicionar despesa:", err);

      // Toast de erro para 500 Internal Server Error
      if (err.response?.status === 500) {
        toast.error("Erro de sincronização, atualizando...");
      } else {
        setError(err.response?.data?.detail || 'Erro ao adicionar despesa');
      }
    }
  };

  const handleRemoveExpense = async (expenseId: number) => {
    if (!selectedProduction) return;

    try {
      await productionsApi.removeExpense(selectedProduction.id, expenseId);

      // Atualizar produção e dados financeiros
      await mutate('/api/v1/productions');

      // Buscar produção atualizada para atualizar o estado local
      const response: ProductionsResponse = await productionsApi.getProductions();
      const updatedProduction = response.productionsList.find((p: Production) => p.id === selectedProduction.id);
      if (updatedProduction) {
        setSelectedProduction(updatedProduction);
      }
    } catch (err: any) {
      console.error("Erro ao remover despesa:", err);
      setError(err.response?.data?.detail || 'Erro ao remover despesa');
    }
  };

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

  const handleLoadMore = () => {
    fetchProductions(currentSkip + LIMIT);
  };

  // Funções auxiliares para shooting sessions dinâmicas
  const addShootingSession = () => {
    setEditForm(prev => ({
      ...prev,
      shooting_sessions: [...prev.shooting_sessions, { date: null, location: null }]
    }));
  };

  const removeShootingSession = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      shooting_sessions: prev.shooting_sessions.filter((_, i) => i !== index)
    }));
  };

  const updateShootingSessionDate = (index: number, value: string) => {
    setEditForm(prev => ({
      ...prev,
      shooting_sessions: prev.shooting_sessions.map((session, i) =>
        i === index ? { ...session, date: value } : session
      )
    }));
  };

  const updateShootingSessionLocation = (index: number, value: string) => {
    setEditForm(prev => ({
      ...prev,
      shooting_sessions: prev.shooting_sessions.map((session, i) =>
        i === index ? { ...session, location: value } : session
      )
    }));
  };

  const handleDeleteProduction = (production: Production) => {
    setProductionToDelete(production);
  };

  const confirmDeleteProduction = async () => {
    if (!productionToDelete) return;
    try {
      await productionsApi.deleteProduction(productionToDelete.id);
      setProductions(productions.filter(p => p.id !== productionToDelete.id));
      await mutate('/api/v1/productions');
      toast.success("Produção excluída com sucesso!");
    } catch (err: any) {
      console.error("Erro ao excluir produção:", err);
      toast.error("Erro ao excluir produção");
    } finally {
      setProductionToDelete(null);
    }
  };


  const handleEdit = (production: Production) => {
    setSelectedProduction(production);
    setEditForm({
      title: production.title,
      status: production.status as ProductionStatus,
      deadline: production.deadline ? new Date(production.deadline).toISOString().split('T')[0] : '',
      shooting_sessions: production.shooting_sessions ? production.shooting_sessions.map(session => ({
        date: session.date ?? null,
        location: session.location ?? null
      })) : [],
      payment_method: production.payment_method || '',
      payment_status: production.payment_status || 'pending',
      due_date: production.due_date ? new Date(production.due_date).toISOString().split('T')[0] : '',
      subtotal: production.subtotal / 100, // Converter para reais para edição
      total_cost: production.total_cost / 100, // Converter para reais para edição
      discount: production.discount ? production.discount / 100 : 0, // Converter centavos para reais
      tax_rate: production.tax_rate,
      notes: production.notes || '',
    });

    setIsEditing(true);
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!selectedProduction) return;

    try {
      // Filtrar shooting sessions válidas (com data ou location)
      const validShootingSessions = editForm.shooting_sessions
        .filter(session => (session.date && session.date.trim() !== "") || (session.location && session.location.trim() !== ""))
        .map(session => ({
          date: session.date && session.date.trim() ? session.date.trim() : null,
          location: session.location && session.location.trim() ? session.location.trim() : null
        }));

      const payload = {
        title: editForm.title,
        status: editForm.status,
        deadline: editForm.deadline ? new Date(editForm.deadline).toISOString() : null,
        shooting_sessions: validShootingSessions.length > 0 ? validShootingSessions : null,
        payment_method: editForm.payment_method,
        payment_status: editForm.payment_status,
        due_date: editForm.due_date ? new Date(editForm.due_date).toISOString() : null,
        subtotal: Math.round(editForm.subtotal * 100), // Converter para centavos
        total_cost: Math.round(editForm.total_cost * 100), // Converter para centavos
        discount: Math.round(editForm.discount * 100), // Converter para centavos
        tax_rate: editForm.tax_rate,
        notes: editForm.notes || null,
      };

      const response = await productionsApi.updateProduction(selectedProduction.id, payload);

      // Atualizar lista e resumo financeiro
      await mutate('/api/v1/productions');

      setIsEditing(false);
      setSheetOpen(false);
      setSelectedProduction(null);
      await fetchProductions(); // Recarregar lista
    } catch (err: any) {
      console.error("Erro no PATCH:", err);
      console.error("Dados do erro:", err.response?.data);
      console.error("Status do erro:", err.response?.status);

      // Verificar se é erro 422 (Unprocessable Entity)
      if (err.response?.status === 422) {
        console.error("Erro 422 - Campos inválidos:", err.response.data.detail);
      }

      setError(err.response?.data?.detail || 'Erro ao salvar produção');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSheetOpen(false);
    setSelectedProduction(null);
  };

  // Função para criar nova produção
  const handleCreateProduction = async () => {
    if (!createForm.title.trim()) return;

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
      await fetchProductions();
    } catch (err: any) {
      console.error("Erro ao criar produção:", err);
      setError(err.response?.data?.detail || 'Erro ao criar produção');
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
  const handleGenerateBudget = async (production: Production) => {
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
        services: productionData.services || [],
        total: productionData.total_value || 0,
        discount: productionData.discount || 0,
        tax: productionData.tax_amount || 0
      };

      const { generateBudgetPDF } = await import('@/components/reports/BudgetGenerator');
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
            deadline: p.deadline,
            payment_method: p.payment_method,
            total_value: p.total_value,
            profit: p.profit
          }))}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          privacyMode={privacyMode}
          onEdit={(production: any) => {
            // Encontrar a produção completa na lista
            const fullProduction = productions.find(p => p.id === production.id);
            if (fullProduction) {
              handleEdit(fullProduction);
            }
          }}
          onDelete={(production: any) => {
            // Encontrar a produção completa na lista
            const fullProduction = productions.find(p => p.id === production.id);
            if (fullProduction) {
              handleDeleteProduction(fullProduction);
            }
          }}
          onDownloadBudget={(production: any) => {
            // Encontrar a produção completa na lista
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
      <ProductionEditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selectedProduction={selectedProduction}
        isEditing={isEditing}
        onSave={handleSave}
        onCancel={handleCancel}
        editForm={editForm}
        onEditFormChange={(updates) => setEditForm(prev => ({ ...prev, ...updates }))}

        // ItemsTab
        services={services}
        selectedService={selectedService}
        newItemQuantity={newItemQuantity}
        onServicesChange={setServices}
        onSelectedServiceChange={setSelectedService}
        onNewItemQuantityChange={setNewItemQuantity}
        onFetchServices={fetchServices}

        // CrewTab
        users={users}
        selectedUser={selectedUser}
        newCrewRole={newCrewRole}
        newCrewFee={newCrewFee}
        onUsersChange={setUsers}
        onSelectedUserChange={setSelectedUser}
        onNewCrewRoleChange={setNewCrewRole}
        onNewCrewFeeChange={setNewCrewFee}
        onFetchUsers={fetchUsers}

        // ExpensesTab
        newExpenseName={newExpenseName}
        newExpenseValue={newExpenseValue}
        newExpenseCategory={newExpenseCategory}
        onNewExpenseNameChange={setNewExpenseName}
        onNewExpenseValueChange={setNewExpenseValue}
        onNewExpenseCategoryChange={setNewExpenseCategory}

        // Shooting Sessions
        onAddShootingSession={addShootingSession}
        onRemoveShootingSession={removeShootingSession}
        onUpdateShootingSessionDate={updateShootingSessionDate}
        onUpdateShootingSessionLocation={updateShootingSessionLocation}

        // Update selectedProduction
        onUpdateSelectedProduction={(production: any) => setSelectedProduction(production)}
      />
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
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateProduction}
                disabled={!createForm.title.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Criar Produção
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Production Confirmation Dialog */}
      <AlertDialog open={!!productionToDelete} onOpenChange={() => setProductionToDelete(null)}>
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
            <AlertDialogAction
              onClick={confirmDeleteProduction}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir Produção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
