'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Receipt, DollarSign, Target, Package, BarChart3, PieChart as PieChartIcon, Users, Activity } from 'lucide-react';
import { dashboardApi } from './src/lib/api';
import { formatCurrency } from './src/lib/utils';
import { usePrivacy } from '../layout';

interface DashboardData {
    total_revenue?: number;
    total_costs?: number;
    total_taxes?: number;
    total_profit?: number;
    total_productions?: number;
    total_earnings?: number;
    production_count?: number;
    monthly_revenue?: Array<{ month: string; revenue: number }>;
    productions_by_status?: Array<{ status: string; count: number; percentage: number }>;
    top_clients?: Array<{ name: string; total_value: number; productions_count: number }>;
    profit_margin?: number;
    avg_production_value?: number;
    completion_rate?: number;
}

export default function DashboardTestPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState<'6months' | '12months' | 'year'>('6months');
    const { privacyMode } = usePrivacy();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await dashboardApi.getSummary();
                // Calcular campos derivados necessários para os gráficos
                const realData = {
                    ...response,
                    profit_margin: response.total_revenue && response.total_revenue > 0
                        ? (response.total_profit / response.total_revenue) * 100
                        : 0,
                    completion_rate: response.completion_rate || (
                        response.productions_by_status
                            ? response.productions_by_status.find((s: any) => s.status === 'completed')?.percentage || 0
                            : 0
                    ),
                    avg_production_value: response.avg_production_value || (
                        response.total_productions && response.total_revenue
                            ? response.total_revenue / response.total_productions
                            : 0
                    )
                };

                setData(realData);
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
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
                    <p className="text-slate-400">Carregando dashboard executivo...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-400 mb-4">Erro: {error}</p>
                    <p className="text-sm text-slate-500">
                        Verifique se o backend está rodando em http://localhost:8000
                    </p>
                </div>
            </div>
        );
    }

    // Enhanced chart data
    const revenueChartData = data?.monthly_revenue || [];
    const statusChartData = data?.productions_by_status || [];

    const statusColors = {
        completed: '#10b981',
        in_progress: '#f59e0b',
        approved: '#3b82f6',
        draft: '#6b7280',
    };

    const statusTranslations: Record<string, string> = {
        completed: 'Concluído',
        in_progress: 'Em Andamento',
        approved: 'Aprovado',
        draft: 'Rascunho',
    };

    return (
        <div className="p-6 space-y-8 relative">
            {/* Header */}
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-50 mb-2">
                            Dashboard Executivo
                        </h1>
                        <p className="text-slate-400">
                            Visão completa do desempenho da FVA
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value as any)}
                            className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-50"
                        >
                            <option value="6months">Últimos 6 meses</option>
                            <option value="12months">Últimos 12 meses</option>
                            <option value="year">Este ano</option>
                        </select>
                    </div>
                </div>

                {/* KPI Cards - Enhanced */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
                    {/* Revenue */}
                    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">
                                Receita Total
                            </h3>
                            <DollarSign className="h-5 w-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <p className={`text-xs font-mono font-bold text-emerald-400 transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}>
                            {formatCurrency(data?.total_revenue || 0)}
                        </p>
                        <div className="flex items-center mt-2">
                            <TrendingUp className="h-4 w-4 text-emerald-400 mr-1" />
                            <span className="text-xs text-emerald-400">+12.5% vs mês anterior</span>
                        </div>
                    </div>

                    {/* Costs */}
                    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">
                                Custos Totais
                            </h3>
                            <Receipt className="h-5 w-5 text-slate-500 group-hover:text-red-400 transition-colors" />
                        </div>
                        <p className={`text-xs font-mono font-bold text-red-400 transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}>
                            {formatCurrency(data?.total_costs || 0)}
                        </p>
                        <div className="flex items-center mt-2">
                            <TrendingUp className="h-4 w-4 text-slate-400 mr-1" />
                            <span className="text-xs text-slate-400">+8.2% vs mês anterior</span>
                        </div>
                    </div>

                    {/* Profit */}
                    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">
                                Lucro Líquido
                            </h3>
                            <TrendingUp className="h-5 w-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <p className={`text-xs font-mono font-bold text-emerald-400 transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}>
                            {formatCurrency(data?.total_profit || 0)}
                        </p>
                        <div className="flex items-center mt-2">
                            <TrendingUp className="h-4 w-4 text-emerald-400 mr-1" />
                            <span className="text-xs text-emerald-400">+15.8% vs mês anterior</span>
                        </div>
                    </div>

                    {/* Profit Margin */}
                    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">
                                Margem de Lucro
                            </h3>
                            <Target className="h-5 w-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <p className="text-2xl font-bold text-blue-400">
                            {data?.profit_margin?.toFixed(1)}%
                        </p>
                        <div className="flex items-center mt-2">
                            <TrendingUp className="h-4 w-4 text-emerald-400 mr-1" />
                            <span className="text-xs text-emerald-400">Meta: 25%</span>
                        </div>
                    </div>

                    {/* Total Productions */}
                    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">
                                Total Produções
                            </h3>
                            <Package className="h-5 w-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                        </div>
                        <p className="text-2xl font-bold text-slate-50">
                            {data?.total_productions || 0}
                        </p>
                        <div className="flex items-center mt-2">
                            <Activity className="h-4 w-4 text-blue-400 mr-1" />
                            <span className="text-xs text-blue-400">+3 este mês</span>
                        </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">
                                Taxa de Conclusão
                            </h3>
                            <BarChart3 className="h-5 w-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                        </div>
                        <p className="text-2xl font-bold text-purple-400">
                            {data?.completion_rate?.toFixed(1)}%
                        </p>
                        <div className="flex items-center mt-2">
                            <TrendingUp className="h-4 w-4 text-emerald-400 mr-1" />
                            <span className="text-xs text-emerald-400">Meta: 90%</span>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Revenue Trend */}
                    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-50">
                                Evolução da Receita
                            </h3>
                            <BarChart3 className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueChartData}>
                                    <XAxis
                                        dataKey="month"
                                        stroke="rgb(148, 163, 184)"
                                        fontSize={12}
                                        tick={{ fill: 'rgb(148, 163, 184)' }}
                                    />
                                    <YAxis
                                        stroke="rgb(148, 163, 184)"
                                        fontSize={12}
                                        tick={{ fill: 'rgb(148, 163, 184)' }}
                                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgb(30, 41, 59)',
                                            border: '1px solid rgba(148, 163, 184, 0.2)',
                                            borderRadius: '8px',
                                            color: 'rgb(248, 250, 252)',
                                        }}
                                        formatter={(value: number | undefined) => value ? [formatCurrency(value * 100), 'Receita'] : ['R$ 0,00', 'Receita']}
                                        labelStyle={{ color: 'rgb(148, 163, 184)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="rgb(59, 130, 246)"
                                        fill="rgba(59, 130, 246, 0.2)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Productions by Status */}
                    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-50">
                                Produções por Status
                            </h3>
                            <PieChartIcon className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusChartData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        dataKey="count"
                                        label={({ index }) => {
                                            const item = statusChartData[index];
                                            const translatedStatus = statusTranslations[item?.status] || item?.status;
                                            return `${translatedStatus}: ${item?.percentage}%`;
                                        }}
                                    >
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={statusColors[entry.status as keyof typeof statusColors] || '#6b7280'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgb(30, 41, 59)',
                                            border: '1px solid rgba(148, 163, 184, 0.2)',
                                            borderRadius: '8px',
                                            color: 'rgb(248, 250, 252)',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Top Clients Table */}
                <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-slate-50">
                            Top Clientes
                        </h3>
                        <Users className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="space-y-4">
                        {data?.top_clients?.map((client, index) => (
                            <div key={client.name} className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/50">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-sm font-medium text-indigo-400">#{index + 1}</span>
                                    </div>
                                    <div>
                                        <p className="text-slate-50 font-medium">{client.name}</p>
                                        <p className="text-slate-400 text-sm">{client.productions_count} produções</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-mono font-bold text-emerald-400 ${privacyMode ? 'blur-md select-none' : ''}`}>
                                        {formatCurrency(client.total_value)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
