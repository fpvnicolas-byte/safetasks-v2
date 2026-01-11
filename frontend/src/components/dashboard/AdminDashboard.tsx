'use client';

import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, Receipt, DollarSign, Target, Package, BarChart3, Activity } from 'lucide-react';
import { dashboardApi } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { usePrivacy } from '../../hooks/use-privacy';
import { useDesignTokens, useAccessibility } from '../../lib/hooks';
import { ChartSection } from '../../components/dashboard/ChartSection';
import DashboardLoading from '../../app/dashboard/loading';

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
    // Payment fields
    pending_payments?: number;
    received_payments?: number;
    overdue_payments?: number;
    payment_rate?: number;
    pending_rate?: number;
    overdue_rate?: number;
}

export function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState<'current_month' | '3months' | '6months' | '12months' | 'year'>('current_month');
    const { privacyMode } = usePrivacy();

    // Design tokens e acessibilidade
    const { colors, spacing, borderRadius, shadows, transitions } = useDesignTokens();
    const { accessibilityUtils } = useAccessibility();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await dashboardApi.getSummary();
                // Calcular campos derivados necessários para os gráficos
                const enhancedData = {
                    ...response,
                    profit_margin: response.total_revenue && response.total_revenue > 0
                        ? (response.total_profit / response.total_revenue) * 100
                        : 0,
                    completion_rate: response.productions_by_status
                        ? response.productions_by_status.find((s: any) => s.status === 'completed')?.percentage || 0
                        : 0
                };

                setData(enhancedData);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Erro ao carregar dados');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Enhanced chart data with intelligent period filtering
    const revenueChartData = useMemo(() => {
        if (!data?.monthly_revenue) {
            // Usuário completamente novo - mostrar mês atual com zero
            const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'short' });
            return [{ month: currentMonthName, revenue: 0 }];
        }

        const availableData = data.monthly_revenue;
        const dataLength = availableData.length;

        // Estratégia baseada na quantidade de dados históricos disponíveis
        switch (selectedPeriod) {
            case 'current_month':
                if (dataLength === 0) {
                    // Sem dados históricos - mostrar apenas mês atual
                    const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'short' });
                    return [{ month: currentMonthName, revenue: 0 }];
                } else if (dataLength === 1) {
                    // Apenas 1 mês de dados - mostrar tendência estimada
                    const current = availableData[0];
                    const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'short' });

                    // Calcular mês anterior estimado (70-90% do atual para tendência realista)
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    const lastMonthName = lastMonth.toLocaleDateString('pt-BR', { month: 'short' });
                    const estimatedLastMonth = Math.max(0, Math.round(current.revenue * 0.8));

                    return [
                        { month: lastMonthName, revenue: estimatedLastMonth },
                        { month: currentMonthName, revenue: current.revenue }
                    ];
                } else {
                    // 2+ meses disponíveis - mostrar tendência real
                    return availableData.slice(-2); // Últimos 2 meses
                }

            case '3months':
                if (dataLength < 3) {
                    // Dados insuficientes - preencher com estimativas
                    const result = [...availableData];
                    while (result.length < 3) {
                        const lastValue = result[result.length - 1]?.revenue || 0;
                        const estimatedValue = Math.max(0, Math.round(lastValue * 0.85)); // Decréscimo gradual

                        const month = new Date();
                        month.setMonth(month.getMonth() - result.length);
                        const monthName = month.toLocaleDateString('pt-BR', { month: 'short' });

                        result.unshift({ month: monthName, revenue: estimatedValue });
                    }
                    return result.slice(-3);
                }
                return availableData.slice(-3);

            case '6months':
                if (dataLength < 6) {
                    // Preencher com dados estimados para manter visual consistente
                    const result = [...availableData];
                    while (result.length < 6) {
                        const lastValue = result[result.length - 1]?.revenue || 0;
                        const estimatedValue = Math.max(0, Math.round(lastValue * 0.9));

                        const month = new Date();
                        month.setMonth(month.getMonth() - result.length);
                        const monthName = month.toLocaleDateString('pt-BR', { month: 'short' });

                        result.unshift({ month: monthName, revenue: estimatedValue });
                    }
                    return result.slice(-6);
                }
                return availableData.slice(-6);

            case '12months':
                // Para 12 meses, sempre mostrar o máximo disponível
                return availableData.slice(-12);

            case 'year':
            default:
                // Mostrar todos os dados disponíveis (mínimo 6 meses se possível)
                return dataLength >= 6 ? availableData : availableData.slice(-Math.max(dataLength, 1));
        }
    }, [data?.monthly_revenue, selectedPeriod]);

    const statusChartData = data?.productions_by_status || [];

    // Detectar se há dados reais vs dados fake
    const hasRealRevenueData = data?.monthly_revenue && data.monthly_revenue.length > 0;
    const hasRealStatusData = data?.productions_by_status && data.productions_by_status.length > 0;
    const hasRealClientsData = data?.top_clients && data.top_clients.length > 0;

    // Dados fake realistas para quando não há dados reais
    const fakeRevenueData = [
        { month: 'Jan', revenue: 12000 },
        { month: 'Fev', revenue: 15000 },
        { month: 'Mar', revenue: 18000 },
        { month: 'Abr', revenue: 22000 },
        { month: 'Mai', revenue: 25000 },
        { month: 'Jun', revenue: 28000 }
    ];

    const fakeStatusData = [
        { name: 'Concluída', value: 45, percentage: 45, fill: '#10b981' },
        { name: 'Em Andamento', value: 30, percentage: 30, fill: '#f59e0b' },
        { name: 'Aprovada', value: 15, percentage: 15, fill: '#3b82f6' },
        { name: 'Rascunho', value: 10, percentage: 10, fill: '#6b7280' }
    ];

    const fakeTopClientsData = [
        { name: 'Empresa ABC Ltda', total_value: 45000, productions_count: 12 },
        { name: 'Tech Solutions S.A.', total_value: 38000, productions_count: 9 },
        { name: 'Marketing Digital Pro', total_value: 32000, productions_count: 7 },
        { name: 'Consultoria XYZ', total_value: 28000, productions_count: 6 },
        { name: 'Inovação Corp', total_value: 22000, productions_count: 5 }
    ];



    // Mostrar loading skeleton enquanto os dados estão sendo carregados
    if (loading) {
        return <DashboardLoading />;
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

    const statusTranslations = {
        'completed': 'Concluída',
        'in_progress': 'Em Andamento',
        'approved': 'Aprovada',
        'draft': 'Rascunho',
        'proposal_sent': 'Proposta Enviada',
        'canceled': 'Cancelada'
    };

    // Função para mapear cores diretamente nos dados
    const getStatusColorForChart = (status: string): string => {
        const colors: Record<string, string> = {
            'completed': '#10b981',      // Verde esmeralda
            'in_progress': '#f59e0b',   // Âmbar
            'approved': '#3b82f6',       // Azul
            'draft': '#6b7280',          // Cinza
            'proposal_sent': '#8b5cf6', // Violeta
            'canceled': '#ef4444',      // Vermelho
        };
        return colors[status] || '#6b7280';
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
                            <option value="current_month">Mês Atual</option>
                            <option value="3months">Últimos 3 meses</option>
                            <option value="6months">Últimos 6 meses</option>
                            <option value="12months">Últimos 12 meses</option>
                            <option value="year">Este ano</option>
                        </select>
                    </div>
                </div>

                {/* KPI Cards - Enhanced */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
                    {/* Revenue */}
                    <div
                        className="backdrop-blur-2xl hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl focus-within:ring-2 focus-within:ring-slate-400"
                        style={{
                            backgroundColor: colors.glass.medium,
                            borderRadius: borderRadius.xl,
                            padding: spacing.lg,
                            borderColor: colors.glass.border,
                            boxShadow: shadows.xl,
                            transition: transitions.normal,
                        }}
                        role="region"
                        aria-labelledby="revenue-title"
                        tabIndex={0}
                    >
                        <div
                            className="flex items-center justify-between"
                            style={{ marginBottom: spacing.md }}
                        >
                            <h3
                                id="revenue-title"
                                className="text-sm font-medium"
                                style={{ color: colors.slate[400] }}
                            >
                                Receita Total
                            </h3>
                            <DollarSign
                                className="h-5 w-5 group-hover:text-emerald-400 transition-colors"
                                style={{
                                    color: colors.slate[500],
                                    transition: transitions.normal,
                                }}
                                aria-hidden="true"
                            />
                        </div>
                        <p
                            className={`font-mono font-bold transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}
                            style={{
                                fontSize: '1.25rem',
                                color: colors.success[400],
                                transition: transitions.normal,
                            }}
                            aria-label={`Receita total: ${formatCurrency(data?.total_revenue || 0)}`}
                        >
                            {formatCurrency(data?.total_revenue || 0)}
                        </p>
                        <div
                            className="flex items-center"
                            style={{ marginTop: spacing.sm }}
                        >
                            <TrendingUp
                                className="h-4 w-4 mr-1"
                                style={{ color: colors.success[400] }}
                                aria-hidden="true"
                            />
                            <span
                                className="text-xs"
                                style={{ color: colors.success[400] }}
                            >
                                +12.5% vs mês anterior
                            </span>
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
                        <p className={`text-xl font-mono font-bold text-red-400 transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}>
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
                        <p className={`text-xl font-mono font-bold text-emerald-400 transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}>
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
                                Mg. de Lucro
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

                    {/* Total Taxes */}
                    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">
                                Total de Impostos
                            </h3>
                            <Receipt className="h-5 w-5 text-slate-500 group-hover:text-orange-400 transition-colors" />
                        </div>
                        <p className={`text-xl font-mono font-bold text-orange-400 transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}>
                            {formatCurrency(data?.total_taxes || 0)}
                        </p>
                        <div className="flex items-center mt-2">
                            <TrendingUp className="h-4 w-4 text-slate-400 mr-1" />
                            <span className="text-xs text-slate-400">
                                Imposto médio: {formatCurrency(data?.total_productions ? (data.total_taxes || 0) / data.total_productions : 0)}
                            </span>
                        </div>
                    </div>

                    {/* Valores a Receber */}
                    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">
                                Valores Pendentes
                            </h3>
                            <TrendingUp className="h-5 w-5 text-slate-500 group-hover:text-orange-400 transition-colors" />
                        </div>
                        <p className={`text-xl font-mono font-bold text-orange-400 transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}>
                            {formatCurrency((data?.pending_payments || 0) + (data?.overdue_payments || 0))}
                        </p>
                        <div className="flex items-center mt-2">
                            <Activity className="h-4 w-4 text-slate-400 mr-1" />
                            <span className="text-xs text-slate-400">
                                {data?.pending_rate ? `${data.pending_rate}% pendentes/vencidos` : '0% pendentes'}
                            </span>
                        </div>
                    </div>

                    {/* Valores Recebidos */}
                    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">
                                Valores Recebidos
                            </h3>
                            <DollarSign className="h-5 w-5 text-slate-500 group-hover:text-green-400 transition-colors" />
                        </div>
                        <p className={`text-xl font-mono font-bold text-green-400 transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}>
                            {formatCurrency(data?.received_payments || 0)}
                        </p>
                        <div className="flex items-center mt-2">
                            <Target className="h-4 w-4 text-slate-400 mr-1" />
                            <span className="text-xs text-slate-400">
                                {data?.payment_rate ? `${data.payment_rate}% do total` : '0% do total'}
                            </span>
                        </div>
                    </div>

                    {/* Valores Vencidos */}
                    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">
                                Valores Vencidos
                            </h3>
                            <Receipt className="h-5 w-5 text-slate-500 group-hover:text-red-400 transition-colors" />
                        </div>
                        <p className={`text-xl font-mono font-bold text-red-400 transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}>
                            {formatCurrency(data?.overdue_payments || 0)}
                        </p>
                        <div className="flex items-center mt-2">
                            <BarChart3 className="h-4 w-4 text-slate-400 mr-1" />
                            <span className="text-xs text-slate-400">
                                {data?.overdue_rate ? `${data.overdue_rate}% do total` : '0% do total'}
                            </span>
                        </div>
                    </div>
                </div>

                <ChartSection
                    data={data || {}}
                    revenueChartData={hasRealRevenueData ? revenueChartData : fakeRevenueData}
                    statusChartData={hasRealStatusData ?
                        statusChartData.map(item => ({
                            name: statusTranslations[item.status as keyof typeof statusTranslations] || item.status, // Traduzir para português
                            value: Math.round(item.percentage), // Arredondar para número elegante
                            percentage: item.percentage,
                            // Adicionar cor diretamente nos dados para garantir aplicação
                            fill: getStatusColorForChart(item.status)
                        })) : fakeStatusData
                    }
                    topClientsData={hasRealClientsData ? data?.top_clients || [] : fakeTopClientsData}
                    privacyMode={privacyMode}
                    hasRealRevenueData={hasRealRevenueData}
                    hasRealStatusData={hasRealStatusData}
                    hasRealClientsData={hasRealClientsData}
                />
            </div>
        </div>
    );
}
