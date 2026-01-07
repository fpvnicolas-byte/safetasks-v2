
'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Search, X, Save, User, Mail, Shield, UserCheck, UserX } from 'lucide-react';
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
  AlertDialogTrigger,
} from '../../../components/ui/alert-dialog';
import { usersApi } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';

// Interfaces baseadas nos schemas do backend
interface User {
  id: number;
  email: string;
  full_name: string;
  organization_id: number;
  role: string;
  is_active?: boolean;
}

interface UserFormData {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'toggle' | 'delete' | null>(null);
  const { mutate } = useSWRConfig();

  // Estado para formulários
  const [formData, setFormData] = useState<UserFormData>({
    full_name: '',
    email: '',
    password: '',
    role: 'crew',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getUsers();
      setUsers(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.password.trim()) return;

    try {
      await usersApi.inviteCrewMember({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      // Limpar formulário e fechar modal
      setCreateModalOpen(false);
      resetForm();
      await mutate('/api/v1/users');
      await fetchUsers();

      // Toast de sucesso
      toast.success("Usuário convidado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao criar usuário:", err);

      // Toast de erro para 400 Bad Request (mantém modal aberto)
      if (err.response?.status === 400) {
        toast.error("Dados inválidos ou e-mail já cadastrado");
      }
      // Tratamento específico para limite de colaboradores (403)
      else if (err.response?.status === 403) {
        toast.error("Limite de colaboradores atingido. Faça upgrade do plano para adicionar mais usuários.");
      }
      else {
        toast.error("Erro ao criar usuário");
      }
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setUserToDelete(user);
      setActionType('toggle');
    }
  };

  const confirmToggleUserStatus = async () => {
    if (!userToDelete) return;

    try {
      await usersApi.updateUserStatus(userToDelete.id, {
        is_active: !userToDelete.is_active
      });

      // Atualizar lista
      await mutate('/api/v1/users');
      await fetchUsers();

      // Toast de sucesso
      toast.success(`Usuário ${userToDelete.is_active ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (err: any) {
      console.error("Erro ao alterar status do usuário:", err);
      toast.error("Erro ao alterar status do usuário");
    } finally {
      setUserToDelete(null);
      setActionType(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setUserToDelete(user);
      setActionType('delete');
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await usersApi.deleteUser(userToDelete.id);

      // Atualizar lista
      await mutate('/api/v1/users');
      await fetchUsers();

      // Toast de sucesso
      toast.success("Usuário excluído com sucesso!");
    } catch (err: any) {
      console.error("Erro ao excluir usuário:", err);
      toast.error("Erro ao excluir usuário");
    } finally {
      setUserToDelete(null);
      setActionType(null);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email,
      password: '', // Password field empty for security
      role: user.role,
    });
    setEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      role: 'crew',
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'crew':
        return 'Equipe';
      case 'user':
        return 'Usuário';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'crew':
        return 'bg-blue-500';
      case 'user':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando usuários...</p>
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
              Usuários e Equipe
            </h1>
            <p className="text-slate-400">
              Gerencie os membros da sua organização e controle de acesso
            </p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mr-4">
                    <User className="h-6 w-6 text-slate-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-50 mb-1 group-hover:text-slate-100 transition-colors">
                      {user.full_name || 'Nome não informado'}
                    </h3>
                    <Badge className={`${getRoleColor(user.role)} text-white text-xs mb-2`}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    <div className="flex items-center text-sm text-slate-400">
                      {user.is_active ? (
                        <UserCheck className="h-4 w-4 mr-1 text-green-400" />
                      ) : (
                        <UserX className="h-4 w-4 mr-1 text-red-400" />
                      )}
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={() => openEditModal(user)}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-300"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleToggleUserStatus(user.id)}
                    variant="ghost"
                    size="sm"
                    className={user.is_active ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}
                    title={user.is_active ? "Desativar usuário" : "Ativar usuário"}
                  >
                    {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={() => handleDeleteUser(user.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    title="Excluir usuário"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-slate-400">
                  <Mail className="h-4 w-4 mr-2" />
                  {user.email}
                </div>

                <div className="flex items-center text-sm text-slate-400">
                  <Shield className="h-4 w-4 mr-2" />
                  Papel: {getRoleLabel(user.role)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">
              {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece convidando membros para sua equipe'}
            </p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-2xl border border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-50 text-xl font-semibold">
              Convidar Novo Usuário
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
                E-mail *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@exemplo.com"
                className="bg-slate-900/50 border-slate-700 text-slate-50"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Senha Temporária *
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Digite uma senha temporária"
                className="bg-slate-900/50 border-slate-700 text-slate-50"
              />
            </div>

            {/* Papel/Role */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Papel/Função
              </label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-50">
                  <SelectValue placeholder="Selecionar papel" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="crew">Equipe</SelectItem>
                  <SelectItem value="user">Usuário Básico</SelectItem>
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
                onClick={handleCreateUser}
                disabled={!formData.full_name.trim() || !formData.email.trim() || !formData.password.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Convidar Usuário
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-2xl border border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-50 text-xl font-semibold">
              Editar Usuário
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
                E-mail *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@exemplo.com"
                className="bg-slate-900/50 border-slate-700 text-slate-50"
              />
            </div>

            {/* Papel/Role */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Papel/Função
              </label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-50">
                  <SelectValue placeholder="Selecionar papel" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="crew">Equipe</SelectItem>
                  <SelectItem value="user">Usuário Básico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedUser(null);
                  resetForm();
                }}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  // Edit functionality would need backend endpoint
                  toast.error("Funcionalidade de edição será implementada com novo endpoint no backend");
                  setEditModalOpen(false);
                  setSelectedUser(null);
                  resetForm();
                }}
                disabled={!formData.full_name.trim() || !formData.email.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete/Toggle Status Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => {
        setUserToDelete(null);
        setActionType(null);
      }}>
        <AlertDialogContent className="bg-slate-950/95 backdrop-blur-2xl border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-50 text-xl font-semibold">
              Confirmar Ação
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {userToDelete && (
                <>
                  Tem certeza que deseja <strong className="text-slate-50">
                    {actionType === 'toggle'
                      ? (userToDelete.is_active ? 'desativar' : 'ativar')
                      : 'excluir'
                    }
                  </strong> o usuário <strong className="text-slate-50">"{userToDelete.full_name}"</strong>?
                  <br />
                  {actionType === 'toggle'
                    ? 'O usuário poderá ou não acessar o sistema dependendo da ação escolhida.'
                    : 'Esta ação não pode ser desfeita.'
                  }
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={actionType === 'toggle' ? confirmToggleUserStatus : confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionType === 'toggle'
                ? (userToDelete?.is_active ? 'Desativar' : 'Ativar')
                : 'Confirmar Exclusão'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
