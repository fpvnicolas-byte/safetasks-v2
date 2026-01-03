'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Receipt, Wallet, DollarSign, Target, Calendar } from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { usePrivacy } from './layout';

interface DashboardData {
  total_revenue?: number;
  total_costs?: number;
  total_taxes?: number;
  total_profit?: number;
  total_productions?: number;
  total_earnings?: number;
  production_count?: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { privacyMode } = usePrivacy();

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando dados...</p>
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

  // Mock data for profit chart (last 6 months)
  const profitChartData = [
    { month: 'Jul', profit: 12500 },
    { month: 'Ago', profit: 15800 },
    { month: 'Set', profit: 22100 },
    { month: 'Out', profit: 18900 },
    { month: 'Nov', profit: 24300 },
    { month: 'Dez', profit: data?.total_profit ? data.total_profit / 100 : 0 },
  ];

  return (
    <div className="p-6 space-y-8 relative">
      {/* Additional background elements for glassmorphism visibility */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Geometric patterns */}
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-gradient-to-r from-blue-500/8 to-purple-500/8 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-32 right-32 w-96 h-96 rounded-full bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-gradient-to-r from-pink-500/4 to-orange-500/4 blur-2xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '2s' }} />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(148,163,184,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148,163,184,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Floating particles effect */}
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-white/20 rounded-full blur-sm animate-bounce" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-white/15 rounded-full blur-sm animate-bounce" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-white/25 rounded-full blur-sm animate-bounce" style={{ animationDelay: '2.5s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Earnings (Crew) */}
          {data?.total_earnings !== undefined && (
            <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">
                  Meus Ganhos
                </h3>
                <Wallet className="h-5 w-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>
              <p className={`text-2xl font-mono font-bold text-slate-50 transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}>
                {formatCurrency(data.total_earnings)}
              </p>
            </div>
          )}

          {/* Production Count (Crew) */}
          {data?.production_count !== undefined && (
            <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">
                  Minhas Produções
                </h3>
                <Target className="h-5 w-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-slate-50">
                {data.production_count}
              </p>
            </div>
          )}

          {/* Revenue (Admin) */}
          {data?.total_revenue !== undefined && data.total_revenue !== null && (
            <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">
                  Receita Total
                </h3>
                <DollarSign className="h-5 w-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>
              <p className={`text-2xl font-mono font-bold text-slate-50 transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}>
                {formatCurrency(data.total_revenue)}
              </p>
            </div>
          )}

          {/* Costs (Admin) */}
          {data?.total_costs !== undefined && data.total_costs !== null && (
            <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">
                  Custos Totais
                </h3>
                <Receipt className="h-5 w-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>
              <p className={`text-2xl font-mono font-bold text-slate-50 transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}>
                {formatCurrency(data.total_costs)}
              </p>
            </div>
          )}

          {/* Taxes (Admin) */}
          {data?.total_taxes !== undefined && data.total_taxes !== null && (
            <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">
                  Impostos
                </h3>
                <Calendar className="h-5 w-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>
              <p className={`text-2xl font-mono font-bold text-slate-50 transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}>
                {formatCurrency(data.total_taxes)}
              </p>
            </div>
          )}

          {/* Profit (Admin) */}
          {data?.total_profit !== undefined && data.total_profit !== null && (
            <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">
                  Lucro Líquido
                </h3>
                <TrendingUp className="h-5 w-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className={`text-2xl font-mono font-bold text-emerald-400 transition-all duration-300 ${privacyMode ? 'blur-md select-none' : ''}`}>
                {formatCurrency(data.total_profit)}
              </p>
            </div>
          )}

          {/* Total Productions (Admin) */}
          {data?.total_productions !== undefined && data.total_productions !== null && (
            <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:bg-slate-950/50 transition-all duration-300 group shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">
                  Total de Produções
                </h3>
                <Target className="h-5 w-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-slate-50">
                {data.total_productions}
              </p>
            </div>
          )}
        </div>

        {/* Profit Chart */}
        <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-50">
              Evolução do Lucro
            </h3>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>

          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitChartData}>
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
                  formatter={(value: number | undefined) => value ? [formatCurrency(value * 100), 'Lucro'] : ['R$ 0,00', 'Lucro']}
                  labelStyle={{ color: 'rgb(148, 163, 184)' }}
                />
                <Bar
                  dataKey="profit"
                  fill="rgba(52, 211, 153, 0.6)"
                  stroke="rgb(52, 211, 153)"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
