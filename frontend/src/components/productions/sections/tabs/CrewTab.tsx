
'use client';

import { Users, User, Plus, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { productionsApi } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/utils';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';

interface CrewTabProps {
  selectedProduction: any;
  users: any[];
  selectedUser: any;
  newCrewRole: string;
  newCrewFee: number;
  onUsersChange: (users: any[]) => void;
  onSelectedUserChange: (user: any) => void;
  onNewCrewRoleChange: (role: string) => void;
  onNewCrewFeeChange: (fee: number) => void;
  onFetchUsers: () => Promise<void>;
  onUpdateSelectedProduction: (production: any) => void;
}

export function CrewTab({
  selectedProduction,
  users,
  selectedUser,
  newCrewRole,
  newCrewFee,
  onUsersChange,
  onSelectedUserChange,
  onNewCrewRoleChange,
  onNewCrewFeeChange,
  onFetchUsers,
  onUpdateSelectedProduction
}: CrewTabProps) {
  const { mutate } = useSWRConfig();

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
      const crewData = {
        user_id: Number(selectedUser.id),
        role: roleValue.trim(),
        fee: Math.round(feeValue * 100), // Em centavos
      };

      await productionsApi.addCrewMember(selectedProduction.id, crewData);

      await mutate('/api/v1/productions');

      // Buscar produção atualizada para atualizar o estado local
      const response = await productionsApi.getProductions();
      const updatedProduction = response.productionsList.find((p: any) => p.id === selectedProduction.id);
      if (updatedProduction) {
        onUpdateSelectedProduction(updatedProduction);
      }

      // Reset form
      onSelectedUserChange(null);
      onNewCrewRoleChange('');
      onNewCrewFeeChange(1);
      toast.success('Membro adicionado com sucesso!');
    } catch (err: any) {
      console.error("Erro ao adicionar membro da equipe:", err);
      if (err.response?.status === 500) {
        toast.error("Erro de sincronização, atualizando...");
      } else {
        toast.error(err.response?.data?.detail || 'Erro ao adicionar membro');
      }
    }
  };

  const handleRemoveCrewMember = async (userId: number) => {
    if (!selectedProduction) return;

    try {
      await productionsApi.removeCrewMember(selectedProduction.id, userId);

      await mutate('/api/v1/productions');

      // Buscar produção atualizada para atualizar o estado local
      const response = await productionsApi.getProductions();
      const updatedProduction = response.productionsList.find((p: any) => p.id === selectedProduction.id);
      if (updatedProduction) {
        onUpdateSelectedProduction(updatedProduction);
      }

      toast.success('Membro removido com sucesso!');
    } catch (err: any) {
      console.error("Erro ao remover membro da equipe:", err);
      toast.error('Erro ao remover membro');
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário para adicionar membros da equipe */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
        <h4 className="text-sm font-medium text-slate-50 mb-4">Adicionar Membro da Equipe</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select
              value={selectedUser?.id ? selectedUser.id.toString() : ''}
              onValueChange={(value) => {
                const user = users.find(u => u.id === parseInt(value));
                onSelectedUserChange(user || null);
              }}
              onOpenChange={(open) => {
                if (open && users.length === 0) {
                  onFetchUsers();
                }
              }}
            >
              <SelectTrigger className="bg-slate-900/50 border-slate-700 h-10 min-h-[40px] px-3 py-2 text-left">
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
                    Nenhum usuário cadastrado.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              value={newCrewRole}
              onChange={(e) => onNewCrewRoleChange(e.target.value)}
              placeholder="Função (ex: Diretor, Cameraman)"
              className="bg-slate-900/50 border-slate-700"
            />
          </div>
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">R$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newCrewFee}
                onChange={(e) => {
                  const value = e.target.value;
                  const parsedValue = parseFloat(value);
                  onNewCrewFeeChange(isNaN(parsedValue) ? 0 : parsedValue);
                }}
                onBlur={(e) => {
                  if (newCrewFee < 1) {
                    onNewCrewFeeChange(1);
                  }
                }}
                placeholder="Cachê"
                className="bg-slate-900/50 border-slate-700 pl-8"
              />
            </div>
          </div>
        </div>
        <div className="mt-4">
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

      {/* Lista de membros da equipe */}
      <div className="space-y-4">
        {selectedProduction.crew && selectedProduction.crew.length > 0 ? (
          <>
            {selectedProduction.crew.map((member: any) => (
              <div key={member.user_id} className="bg-white/5 rounded-xl p-4 border border-white/10">
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
                    {formatCurrency(selectedProduction.crew.reduce((total: number, member: any) => total + (member.fee || 0), 0))}
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
    </div>
  );
}
