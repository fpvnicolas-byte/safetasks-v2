'use client';

import { useEffect, useState } from 'react';
import { Film, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import { dashboardApi } from '../src/lib/api';
import { formatCurrency } from '../src/lib/utils';
import { useDesignTokens } from '../src/lib/hooks';
import { DashboardCardSkeleton } from '../ui/dashboard-card-skeleton';
import Link from 'next/link';

interface DashboardData {
    total_earnings?: number;
    production_count?: number;
    // Other fields might be null/undefined
}

export function CrewDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { colors, borderRadius, shadows, transitions, spacing } = useDesignTokens();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await dashboardApi.getSummary();
                setData(response);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Erro ao carregar dados');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DashboardCardSkeleton />
                    <DashboardCardSkeleton />
                    <DashboardCardSkeleton />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-400 mb-4">Erro: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 relative">
            {/* Header */}
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-50 mb-2">
                        Minha Área
                    </h1>
                    <p className="text-slate-400">
                        Resumo das suas atividades e produções
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Productions Count */}
                    <div
                        className="backdrop-blur-2xl p-6 border border-white/10 shadow-xl"
                        style={{
                            backgroundColor: colors.glass.medium,
                            borderRadius: borderRadius.xl,
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">
                                Produções Ativas
                            </h3>
                            <Film className="h-5 w-5 text-blue-400" />
                        </div>
                        <p className="text-2xl font-bold text-slate-50">
                            {data?.production_count || 0}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                            Projetos onde você está alocado
                        </p>
                    </div>

                    {/* Earnings */}
                    <div
                        className="backdrop-blur-2xl p-6 border border-white/10 shadow-xl"
                        style={{
                            backgroundColor: colors.glass.medium,
                            borderRadius: borderRadius.xl,
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">
                                Meus Ganhos (Estimados)
                            </h3>
                            <DollarSign className="h-5 w-5 text-emerald-400" />
                        </div>
                        <p className="text-2xl font-bold text-emerald-400">
                            {formatCurrency(data?.total_earnings || 0)}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                            Soma dos cachês acordados
                        </p>
                    </div>

                    {/* Quick Actions / Calendar Link */}
                    <div
                        className="backdrop-blur-2xl p-6 border border-white/10 shadow-xl flex flex-col justify-between"
                        style={{
                            backgroundColor: colors.glass.medium,
                            borderRadius: borderRadius.xl,
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">
                                Próximos Eventos
                            </h3>
                            <Calendar className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <Link
                                href="/dashboard/calendar"
                                className="inline-flex items-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                Ver meu calendário
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Links Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/dashboard/productions" className="block group">
                        <div
                            className="p-6 rounded-xl border border-white/5 bg-slate-900/50 hover:bg-slate-800/50 transition-all"
                        >
                            <h3 className="text-lg font-semibold text-slate-200 group-hover:text-white mb-2">
                                Acessar Produções
                            </h3>
                            <p className="text-slate-400 text-sm">
                                Veja detalhes, roteiros e cronogramas das produções que você participa.
                            </p>
                        </div>
                    </Link>

                    <Link href="/dashboard/calendar" className="block group">
                        <div
                            className="p-6 rounded-xl border border-white/5 bg-slate-900/50 hover:bg-slate-800/50 transition-all"
                        >
                            <h3 className="text-lg font-semibold text-slate-200 group-hover:text-white mb-2">
                                Ver Cronograma
                            </h3>
                            <p className="text-slate-400 text-sm">
                                Confira as datas de filmagem e diárias agendadas.
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
