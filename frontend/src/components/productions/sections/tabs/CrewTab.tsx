
'use client';

import { useState, useEffect } from 'react';
import { Users, User, Plus, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { formatCurrency } from '../../../../lib/utils';
import { ProductionCrewResponse } from '../ProductionEditSheet'; // Import types from parent

interface CrewTabProps {
  crew: ProductionCrewResponse[]; // Receives the local state from parent (including negative IDs)
  users: any[]; // Options for the select (should be a specific UserResponse type if available)
  newCrewRole: string; // Local state of parent for new crew member role
  newCrewFee: number; // Local state of parent for new crew member fee
  onNewCrewRoleChange: (role: string) => void; // Parent setter
  onNewCrewFeeChange: (fee: number) => void; // Parent setter
  onFetchUsers: () => Promise<void>; // Parent fetcher
  onAddCrewMember: (selectedUserId: string, role: string, fee: number) => void; // Parent handler
  onRemoveCrewMember: (crewId: number) => void; // Parent handler
}

export function CrewTab({
  crew,
  users,
  newCrewRole,
  newCrewFee,
  onNewCrewRoleChange,
  onNewCrewFeeChange,
  onFetchUsers,
  onAddCrewMember,
  onRemoveCrewMember
}: CrewTabProps) {
  // Estado local para controlar o Select (não usar estado global)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  return (
    <div className="space-y-6">
      {/* Formulário para adicionar membros da equipe */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-slate-400" />
          <h4 className="text-sm font-medium text-slate-50">Adicionar Membro da Equipe</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select
              value={selectedMemberId}
              onValueChange={setSelectedMemberId}
              onOpenChange={(open) => {
                if (open && (!users || users.length === 0)) {
                  onFetchUsers();
                }
              }}
            >
              <SelectTrigger className="bg-slate-900/50 border-slate-700 h-10 min-h-[40px] px-3 py-2 text-left">
                <SelectValue placeholder="Selecionar usuário" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {users && users.length > 0 ? (
                  users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-slate-400">
                    Nenhum usuário encontrado.
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
                  if (newCrewFee < 0.01) { // Changed from 1 to 0.01 since we're working with reais now
                    onNewCrewFeeChange(0);
                  }
                }}
                placeholder="Cachê"
                className="bg-slate-900/50 border-slate-700 pl-8"
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <Button
              onClick={() => {
                console.group('🔵 CrewTab Button Clicked');
                console.log('📦 selectedMemberId (raw):', selectedMemberId, 'type:', typeof selectedMemberId);

                if (selectedMemberId) {
                  console.log('📦 newCrewRole:', newCrewRole);
                  console.log('📦 newCrewFee:', newCrewFee);
                  console.log('✅ Calling onAddCrewMember with UUID string...');

                  onAddCrewMember(selectedMemberId, newCrewRole, newCrewFee);  // Pass UUID string directly

                  console.log('✅ onAddCrewMember called, clearing form...');
                  setSelectedMemberId('');
                  onNewCrewRoleChange('');
                  onNewCrewFeeChange(0);
                  console.log('✅ Form cleared');
                } else {
                  console.error('❌ selectedMemberId is empty/falsy:', selectedMemberId);
                }
                console.groupEnd();
              }}
              disabled={!selectedMemberId || !newCrewRole.trim()}
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
        {crew && crew.length > 0 ? (
          <>
            {crew.map((member: ProductionCrewResponse, index: number) => (
              <div
                key={member.id > 0 ? `crew-${member.id}` : `temp-crew-${index}-${member.user_id}`}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
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
                      onClick={() => onRemoveCrewMember(member.id)}
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
                    {formatCurrency(crew.reduce((total: number, member: ProductionCrewResponse) => total + (member.fee || 0), 0))}
                  </p>
                  <p className="text-xs text-slate-400">
                    {crew.length} membro{crew.length !== 1 ? 's' : ''}
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
