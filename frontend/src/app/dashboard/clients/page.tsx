'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Search, X, User, Phone, Mail, Building, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { clientsApi } from 'src/lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';

// Interfaces baseadas nos schemas do backend
interface Client {
  id: number;
  full_name: string;
  email: string | null;
  cnpj: string | null;
  address: string | null;
  phone: string | null;
  organization_id: number;
  created_at: string;
}

interface ClientFormData {
  full_name: string;
  email: string;
  cnpj: string;
  address: string;
  phone: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const { mutate } = useSWRConfig();

  // Estado para formulários
  const [formData, setFormData] = useState<ClientFormData>({
    full_name: '',
    email: '',
    cnpj: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients();
      setClients(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!formData.full_name.trim()) return;

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || null,
        cnpj: formData.cnpj.trim() || null,
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
      };

      await clientsApi.createClient(payload);

      // Limpar formulário e fechar modal
      setCreateModalOpen(false);
      resetForm();
      await mutate('/api/v1/clients');
      await fetchClients();

      // Toast de sucesso
      toast.success("Cliente criado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao criar cliente:", err);

      // Toast de erro para 400 Bad Request (mantém modal aberto)
      if (err.response?.status === 400) {
        toast.error("Dados inválidos ou cliente já cadastrado");
      } else {
        toast.error("Erro ao criar cliente");
      }
    }
  };

  const handleEditClient = async () => {
    if (!selectedClient || !formData.full_name.trim()) return;

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || null,
        cnpj: formData.cnpj.trim() || null,
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
      };

      await clientsApi.updateClient(selectedClient.id, payload);

      // Fechar modal e atualizar lista
      setEditModalOpen(false);
      setSelectedClient(null);
      resetForm();
      await mutate('/api/v1/clients');
      await fetchClients();

      // Toast de sucesso
      toast.success("Cliente atualizado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao editar cliente:", err);

      // Toast de erro para 400 Bad Request (mantém modal aberto)
      if (err.response?.status === 400) {
        toast.error("Dados inválidos ou cliente já cadastrado");
      } else {
        toast.error("Erro ao editar cliente");
      }
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setClientToDelete(client);
    }
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      await clientsApi.deleteClient(clientToDelete.id);
      await mutate('/api/v1/clients');
      await fetchClients();

      toast.success("Cliente excluído com sucesso!");
    } catch (err: any) {
      console.error("Erro ao excluir cliente:", err);
      toast.error("Erro ao excluir cliente");
    } finally {
      setClientToDelete(null);
    }
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      full_name: client.full_name,
      email: client.email || '',
      cnpj: client.cnpj || '',
      address: client.address || '',
      phone: client.phone || '',
    });
    setEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      cnpj: '',
      address: '',
      phone: '',
    });
  };

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando clientes...</p>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-50 mb-2">
              Clientes
            </h1>
            <p className="text-slate-400">
              Gerencie todos os seus clientes e contatos
            </p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-slate-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-50 mb-1 group-hover:text-slate-100 transition-colors">
                      {client.full_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Criado em {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={() => openEditModal(client)}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-300"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteClient(client.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {client.email && (
                  <div className="flex items-center text-sm text-slate-400">
                    <Mail className="h-4 w-4 mr-2" />
                    {client.email}
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-center text-sm text-slate-400">
                    <Phone className="h-4 w-4 mr-2" />
                    {client.phone}
                  </div>
                )}

                {client.cnpj && (
                  <div className="flex items-center text-sm text-slate-400">
                    <Building className="h-4 w-4 mr-2" />
                    CNPJ: {client.cnpj}
                  </div>
                )}

                {client.address && (
                  <div className="flex items-center text-sm text-slate-400">
                    <MapPin className="h-4 w-4 mr-2" />
                    {client.address}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </p>
            <p className="text-slate-500 text-sm">
              {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece cadastrando seu primeiro cliente'}
            </p>
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-2xl border border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-50 text-xl font-semibold">
              Novo Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome Completo *
              </label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Digite o nome completo"
                className="bg-slate-900/50 border-slate-700 text-slate-50 focus:border-slate-500"
                autoFocus
              />
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                E-mail
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cliente@exemplo.com"
                className="bg-slate-900/50 border-slate-700 text-slate-50"
              />
            </div>

            {/* CNPJ */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                CNPJ/CPF
              </label>
              <Input
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                className="bg-slate-900/50 border-slate-700 text-slate-50"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Telefone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="bg-slate-900/50 border-slate-700 text-slate-50"
              />
            </div>

            {/* Endereço */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Endereço
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, cidade - UF"
                className="bg-slate-900/50 border-slate-700 text-slate-50"
              />
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
                onClick={handleCreateClient}
                disabled={!formData.full_name.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Criar Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Client Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-2xl border border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-50 text-xl font-semibold">
              Editar Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome Completo *
              </label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Digite o nome completo"
                className="bg-slate-900/50 border-slate-700 text-slate-50 focus:border-slate-500"
                autoFocus
              />
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                E-mail
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cliente@exemplo.com"
                className="bg-slate-900/50 border-slate-700 text-slate-50"
              />
            </div>

            {/* CNPJ */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                CNPJ/CPF
              </label>
              <Input
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                className="bg-slate-900/50 border-slate-700 text-slate-50"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Telefone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="bg-slate-900/50 border-slate-700 text-slate-50"
              />
            </div>

            {/* Endereço */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Endereço
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, cidade - UF"
                className="bg-slate-900/50 border-slate-700 text-slate-50"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedClient(null);
                  resetForm();
                }}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditClient}
                disabled={!formData.full_name.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <AlertDialogContent className="bg-slate-950/95 backdrop-blur-2xl border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-50 text-xl font-semibold">
              Excluir Cliente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja excluir o cliente <strong className="text-slate-50">"{clientToDelete?.full_name}"</strong>?
              <br />
              Esta ação não pode ser desfeita e pode afetar produções associadas a este cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClient}
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
