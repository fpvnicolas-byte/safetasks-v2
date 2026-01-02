'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Search, Filter, Save, Calendar, Trash2, MapPin, CreditCard, DollarSign, TrendingUp, Users, Package, User, FileText, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { productionsApi, servicesApi, usersApi, clientsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';

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

export default function ProductionsPage() {
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
  const { mutate } = useSWRConfig();
  const router = useRouter();

  // Estados para as abas dinâmicas
  const [services, setServices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newCrewRole, setNewCrewRole] = useState('');
  const [newCrewFee, setNewCrewFee] = useState(0);

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
    shooting_sessions: Array<{date: string | null, location: string | null}>;
    payment_method: string;
    payment_status: string;
    due_date: string;
    subtotal: number;
    total_cost: number;
    discount: number;
    tax_rate: number;
  }>({
    title: '',
    status: 'draft' as ProductionStatus,
    deadline: '',
    shooting_sessions: [] as Array<{date: string | null, location: string | null}>,
    payment_method: '',
    payment_status: 'pending',
    due_date: '',
    subtotal: 0,
    total_cost: 0,
    discount: 0,
    tax_rate: 0,
  });

  useEffect(() => {
    fetchProductions();
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
      const updatedProductions = await productionsApi.getProductions();
      const updatedProduction = updatedProductions.find((p: Production) => p.id === selectedProduction.id);
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
      const updatedProductions = await productionsApi.getProductions();
      const updatedProduction = updatedProductions.find((p: Production) => p.id === selectedProduction.id);
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
      const updatedProductions = await productionsApi.getProductions();
      const updatedProduction = updatedProductions.find((p: Production) => p.id === selectedProduction.id);
      if (updatedProduction) {
        setSelectedProduction(updatedProduction);
      }

      // Reset form
      setSelectedUser(null);
      setNewCrewRole('');
      setNewCrewFee(0);
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
      const updatedProductions = await productionsApi.getProductions();
      const updatedProduction = updatedProductions.find((p: Production) => p.id === selectedProduction.id);
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
      const updatedProductions = await productionsApi.getProductions();
      const updatedProduction = updatedProductions.find((p: Production) => p.id === selectedProduction.id);
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
      const updatedProductions = await productionsApi.getProductions();
      const updatedProduction = updatedProductions.find((p: Production) => p.id === selectedProduction.id);
      if (updatedProduction) {
        setSelectedProduction(updatedProduction);
      }
    } catch (err: any) {
      console.error("Erro ao remover despesa:", err);
      setError(err.response?.data?.detail || 'Erro ao remover despesa');
    }
  };

  const fetchProductions = async () => {
    try {
      const response = await productionsApi.getProductions();
      setProductions(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar produções');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando produções...</p>
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
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-gradient-to-r from-blue-500/8 to-purple-500/8 blur-3xl animate-pulse" />
        <div className="absolute bottom-32 right-32 w-96 h-96 rounded-full bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-50 mb-2">
              Produções
            </h1>
            <p className="text-slate-400">
              Gerencie todas as suas produções audiovisuais
            </p>
          </div>
          <Button
            onClick={() => {
              setCreateModalOpen(true);
              fetchClients(); // Buscar clientes ao abrir modal
            }}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Produção
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar produções..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-700"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700">
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="proposal_sent">Proposta Enviada</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="canceled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Productions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProductions.map((production) => (
            <div
              key={production.id}
              className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 cursor-pointer group"
              onClick={() => handleEdit(production)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-50 mb-2 group-hover:text-slate-100 transition-colors">
                    {production.title}
                  </h3>
                  <Badge className={`${statusColors[production.status as ProductionStatus]} text-white`}>
                    {statusLabels[production.status as ProductionStatus]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduction(production);
                    }}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-400/80 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Edit className="h-4 w-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-slate-400">
                  <Calendar className="h-4 w-4 mr-2" />
                  {production.deadline ? new Date(production.deadline).toLocaleDateString('pt-BR') : '--'}
                </div>



                <div className="flex items-center text-sm text-slate-400">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {production.payment_method || '--'}
                </div>

                <div className="flex items-center text-sm text-slate-400">
                  <DollarSign className="h-4 w-4 mr-2" />
                  {formatCurrency(production.total_value)}
                </div>

                {production.profit !== 0 && (
                  <div className="flex items-center text-sm text-emerald-400">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {formatCurrency(production.profit)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

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
      </div>

      {/* Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 [&>button]:hidden">
          <SheetHeader className="border-b border-white/10 pb-4 relative">
            <div className="flex items-center justify-between w-full pr-12">
              <SheetTitle className="text-slate-50">
                {selectedProduction?.title}
              </SheetTitle>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSave}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={!isEditing}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => setSheetOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary text-slate-400 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>

          {selectedProduction && (
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
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
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
                          onValueChange={(value) => setEditForm({ ...editForm, status: value as ProductionStatus })}
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
                          onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
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
                            onClick={addShootingSession}
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
                                  onClick={() => removeShootingSession(index)}
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
                                    onChange={(e) => updateShootingSessionDate(index, e.target.value)}
                                    className="bg-slate-900/50 border-slate-700 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Local</label>
                                  <Input
                                    value={session.location ?? ""}
                                    onChange={(e) => updateShootingSessionLocation(index, e.target.value)}
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
                            selectedProduction.shooting_sessions.map((session, index) => (
                              <div key={index} className="bg-slate-800/30 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-400" />
                                    <span className="text-sm text-slate-50">
                                      {session.date ? new Date(session.date).toLocaleDateString('pt-BR') : 'Data não definida'}
                                    </span>
                                  </div>
                                  {session.location && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-slate-400" />
                                      <span className="text-sm text-slate-300">{session.location}</span>
                                    </div>
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
                          onValueChange={(value) => setEditForm({ ...editForm, payment_status: value })}
                        >
                          <SelectTrigger className="bg-slate-900/50 border-slate-700">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                            <SelectItem value="partially_paid">Parcialmente Pago</SelectItem>
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
                          onValueChange={(value) => setEditForm({ ...editForm, payment_method: value })}
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
                          onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
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
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.discount}
                          onChange={(e) => setEditForm({ ...editForm, discount: parseFloat(e.target.value) || 0 })}
                          className="bg-slate-900/50 border-slate-700"
                          placeholder="0.00"
                        />
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
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={editForm.tax_rate}
                          onChange={(e) => setEditForm({ ...editForm, tax_rate: parseFloat(e.target.value) || 0 })}
                          className="bg-slate-900/50 border-slate-700"
                          placeholder="0.00"
                        />
                      ) : (
                        <p className="text-slate-50">
                          {selectedProduction.tax_rate}%
                        </p>
                      )}
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
                          {formatCurrency(selectedProduction.subtotal)}
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
                          {formatCurrency(selectedProduction.total_cost)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Equipe: {formatCurrency(selectedProduction.crew?.reduce((total, member) => total + (member.fee || 0), 0) || 0)} +
                        </p>
                        <p className="text-xs text-slate-500">
                          Despesas: {formatCurrency(selectedProduction.expenses?.reduce((total, expense) => total + expense.value, 0) || 0)}
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
                          {selectedProduction.tax_rate}%
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-2xl font-bold text-yellow-400">
                          {formatCurrency(selectedProduction.tax_amount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Sobre {formatCurrency(selectedProduction.subtotal)}
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
                        <p className={`text-3xl font-bold ${selectedProduction.profit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                          {formatCurrency(selectedProduction.profit)}
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
                      <span className={`font-mono font-bold ${selectedProduction.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {selectedProduction.subtotal > 0 ?
                          `${((selectedProduction.profit / selectedProduction.subtotal) * 100).toFixed(1)}%` :
                          '0%'
                        }
                      </span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="items" className="space-y-6 mt-6">
                  {/* Formulário para adicionar itens */}
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
                    <h4 className="text-sm font-medium text-slate-50 mb-4">Adicionar Serviço</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Select
                          value={selectedService?.id || ''}
                          onValueChange={(value) => {
                            const service = services.find(s => s.id === parseInt(value));
                            setSelectedService(service || null);
                          }}
                          onOpenChange={(open) => {
                            if (open && services.length === 0) {
                              fetchServices();
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
                                Nenhum serviço cadastrado. Cadastre no menu lateral (em breve).
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
                          onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
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
                      selectedProduction.items.map((item) => (
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
                </TabsContent>

                <TabsContent value="crew" className="space-y-6 mt-6">
                  {/* Formulário para adicionar membros da equipe */}
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
                    <h4 className="text-sm font-medium text-slate-50 mb-4">Adicionar Membro da Equipe</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Select
                          value={selectedUser?.id || ''}
                          onValueChange={(value) => {
                            const user = users.find(u => u.id === parseInt(value));
                            setSelectedUser(user || null);
                          }}
                          onOpenChange={(open) => {
                            if (open && users.length === 0) {
                              fetchUsers();
                            }
                          }}
                        >
                          <SelectTrigger className="bg-slate-900/50 border-slate-700">
                            <SelectValue placeholder="Selecionar usuário" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            {users.length > 0 ? (
                              users.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.full_name} ({user.email})
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-sm text-slate-400">
                                Nenhum usuário cadastrado. Cadastre no menu lateral (em breve).
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Input
                          value={newCrewRole}
                          onChange={(e) => setNewCrewRole(e.target.value)}
                          placeholder="Função (ex: Diretor, Cameraman)"
                          className="bg-slate-900/50 border-slate-700"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          step="0.01"
                          value={newCrewFee}
                          onChange={(e) => setNewCrewFee(parseFloat(e.target.value) || 0)}
                          placeholder="Cachê (R$)"
                          className="bg-slate-900/50 border-slate-700"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Button
                          onClick={handleAddCrewMember}
                          disabled={!selectedUser || !newCrewRole.trim()}
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Membro
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Lista de membros da equipe */}
                  <div className="space-y-4">
                    {selectedProduction.crew && selectedProduction.crew.length > 0 ? (
                      <>
                        {selectedProduction.crew.map((member, index) => (
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
                                <Button
                                  onClick={() => handleRemoveCrewMember(member.user_id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
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
                                {formatCurrency(selectedProduction.crew.reduce((total, member) => total + (member.fee || 0), 0))}
                              </p>
                              <p className="text-xs text-slate-400">
                                {selectedProduction.crew.length} membro{selectedProduction.crew.length !== 1 ? 's' : ''}
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
                  {/* Formulário para adicionar despesas */}
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
                    <h4 className="text-sm font-medium text-slate-50 mb-4">Adicionar Despesa</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Input
                          value={newExpenseName}
                          onChange={(e) => setNewExpenseName(e.target.value)}
                          placeholder="Nome da despesa"
                          className="bg-slate-900/50 border-slate-700"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          step="0.01"
                          value={newExpenseValue}
                          onChange={(e) => setNewExpenseValue(parseFloat(e.target.value) || 0)}
                          placeholder="Valor (R$)"
                          className="bg-slate-900/50 border-slate-700"
                        />
                      </div>
                      <div>
                        <Select
                          value={newExpenseCategory}
                          onValueChange={setNewExpenseCategory}
                        >
                          <SelectTrigger className="bg-slate-900/50 border-slate-700">
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="Alimentação">Alimentação</SelectItem>
                            <SelectItem value="Transporte">Transporte</SelectItem>
                            <SelectItem value="Locação">Locação</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-3">
                        <Button
                          onClick={handleAddExpense}
                          disabled={!newExpenseName.trim() || newExpenseValue <= 0}
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Despesa
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Lista de despesas */}
                  <div className="space-y-4">
                    {selectedProduction.expenses && selectedProduction.expenses.length > 0 ? (
                      <>
                        {selectedProduction.expenses.map((expense) => (
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
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-mono font-bold text-slate-50">
                                  {formatCurrency(expense.value)}
                                </p>
                                <Button
                                  onClick={() => handleRemoveExpense(expense.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
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
                                {formatCurrency(selectedProduction.expenses.reduce((total, expense) => total + expense.value, 0))}
                              </p>
                              <p className="text-xs text-slate-400">
                                {selectedProduction.expenses.length} despesa{selectedProduction.expenses.length !== 1 ? 's' : ''}
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
          )}
        </SheetContent>
      </Sheet>

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
