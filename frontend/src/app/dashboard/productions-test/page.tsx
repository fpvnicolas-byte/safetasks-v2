'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Save, Calendar, Trash2, MapPin, CreditCard, DollarSign, TrendingUp, Users, Package, User, FileText, X } from 'lucide-react';
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
import { usePrivacy } from '../layout';

// Importar componentes refatorados
import { ProductionHeader } from '@/components/productions/sections/ProductionHeader';
import { ProductionFilters } from '@/components/productions/sections/ProductionFilters';
import { ProductionEditSheet } from '@/components/productions/sections/ProductionEditSheet';
import { ProductionGrid } from '@/components/productions/sections/ProductionGrid';

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

interface ProductionsResponse {
  productionsList: Production[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

type ProductionStatus = 'draft' | 'proposal_sent' | 'approved' | 'in_progress' | 'completed' | 'canceled';


export default function ProductionsTestPage() {
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
  const { mutate } = useSWRConfig();
  const router = useRouter();

  // Estados para as abas dinâmicas
  const [services, setServices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newCrewRole, setNewCrewRole] = useState('');
  const [newCrewFee, setNewCrewFee] = useState(1); // Alterado para 1

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
    discount: 0,
    tax_rate: 0,
    notes: '',
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

  const fetchProductions = async () => {
    try {
      const response: ProductionsResponse = await productionsApi.getProductions();
      setProductions(response.productionsList || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar produções');
    } finally {
      setLoading(false);
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

  const handleCreateClick = () => {
    setCreateModalOpen(true);
    fetchClients();
  };

  const handleEdit = (production: any) => {
    // Encontrar a produção completa na lista
    const fullProduction = productions.find(p => p.id === production.id);
    if (!fullProduction) return;

    setSelectedProduction(fullProduction);
    setEditForm({
      title: fullProduction.title,
      status: fullProduction.status as ProductionStatus,
      deadline: fullProduction.deadline ? new Date(fullProduction.deadline).toISOString().split('T')[0] : '',
      shooting_sessions: fullProduction.shooting_sessions ? fullProduction.shooting_sessions.map(session => ({
        date: session.date ?? null,
        location: session.location ?? null
      })) : [],
      payment_method: fullProduction.payment_method || '',
      payment_status: fullProduction.payment_status || 'pending',
      due_date: fullProduction.due_date ? new Date(fullProduction.due_date).toISOString().split('T')[0] : '',
      discount: fullProduction.discount ? fullProduction.discount / 100 : 0, // Converter centavos para reais
      tax_rate: fullProduction.tax_rate,
      notes: fullProduction.notes || '',
    });
    setIsEditing(true); // Ativar modo de edição
    setSheetOpen(true);
  };

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
      toast.success('Produção criada com sucesso!');
    } catch (err: any) {
      console.error("Erro ao criar produção:", err);
      toast.error('Erro ao criar produção');
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
        payment_status: editForm.payment_status,
        payment_method: editForm.payment_method,
        due_date: editForm.due_date ? new Date(editForm.due_date).toISOString() : null,
        discount: Math.round(editForm.discount * 100), // Converter para centavos
        tax_rate: editForm.tax_rate,
        notes: editForm.notes || null,
      };

      await productionsApi.updateProduction(selectedProduction.id, payload);

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
      toast.error('Erro ao salvar produção');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSheetOpen(false);
    setSelectedProduction(null);
  };

  const handleDeleteProduction = (production: any) => {
    // Encontrar a produção completa na lista
    const fullProduction = productions.find(p => p.id === production.id);
    if (fullProduction) {
      setProductionToDelete(fullProduction);
    }
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
      toast.error('Erro ao excluir produção');
    } finally {
      setProductionToDelete(null);
    }
  };

  const handleUpdateSelectedProduction = (production: any) => {
    setSelectedProduction(production);
  };

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
        {/* 🧪 TESTE: Usando componentes refatorados */}
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <h3 className="text-yellow-400 font-semibold mb-2">🧪 TESTE DE INTEGRAÇÃO</h3>
          <p className="text-yellow-300 text-sm">
            Esta é uma página de teste usando componentes refatorados.
            A página original (/dashboard/productions) permanece 100% intacta.
          </p>
        </div>

        {/* Usando ProductionHeader refatorado */}
        <ProductionHeader onCreateClick={handleCreateClick} />

        {/* Usando ProductionFilters refatorado */}
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
          onEdit={handleEdit}
          onDelete={handleDeleteProduction}
          onDownloadBudget={async (production) => {
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
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!productionToDelete} onOpenChange={() => setProductionToDelete(null)}>
        <AlertDialogContent className="bg-slate-950/95 backdrop-blur-2xl border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-50">
              Excluir Produção
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja excluir a produção "{productionToDelete?.title}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduction}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Usando ProductionEditSheet refatorado */}
      <ProductionEditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selectedProduction={selectedProduction}
        isEditing={isEditing}
        onSave={handleSave}
        onCancel={handleCancel}
        editForm={editForm}
        onEditFormChange={(updates) => setEditForm(prev => ({ ...prev, ...updates }))}
        onAddShootingSession={addShootingSession}
        onRemoveShootingSession={removeShootingSession}
        onUpdateShootingSessionDate={updateShootingSessionDate}
        onUpdateShootingSessionLocation={updateShootingSessionLocation}
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
        onUpdateSelectedProduction={handleUpdateSelectedProduction}
      />
    </div>
  );
}
