'use client';

import { Search } from 'lucide-react';
import { Input } from ../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from ../../components/ui/select';

type ProductionStatus = 'draft' | 'proposal_sent' | 'approved' | 'in_progress' | 'completed' | 'canceled';

interface ProductionFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (value: string) => void;
}

const statusLabels: Record<ProductionStatus, string> = {
    draft: 'Rascunho',
    proposal_sent: 'Proposta Enviada',
    approved: 'Aprovada',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
    canceled: 'Cancelada',
};

export function ProductionFilters({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange
}: ProductionFiltersProps) {
    return (
        <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar produções..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 bg-slate-900/50 border-slate-700"
                        />
                    </div>
                </div>
                <div className="sm:w-48">
                    <Select value={statusFilter} onValueChange={onStatusChange}>
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
    );
}


