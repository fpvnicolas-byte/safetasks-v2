'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load recharts components to reduce initial bundle size
const AreaChart = dynamic(() => import('recharts').then(mod => ({ default: mod.AreaChart })), {
  ssr: false,
  loading: () => <ChartSkeleton />
});

const Area = dynamic(() => import('recharts').then(mod => ({ default: mod.Area })), {
  ssr: false
});

const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), {
  ssr: false
});

const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), {
  ssr: false
});

const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), {
  ssr: false
});

const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), {
  ssr: false
});

const PieChart = dynamic(() => import('recharts').then(mod => ({ default: mod.PieChart })), {
  ssr: false,
  loading: () => <ChartSkeleton />
});

const Pie = dynamic(() => import('recharts').then(mod => ({ default: mod.Pie })), {
  ssr: false
});

const Cell = dynamic(() => import('recharts').then(mod => ({ default: mod.Cell })), {
  ssr: false
});

interface ChartData {
  monthly_revenue?: Array<{ month: string; revenue: number }>;
  productions_by_status?: Array<{ status: string; count: number; percentage: number; total_value?: number }>;
  top_clients?: Array<{ name: string; total_value: number; productions_count: number }>;
}

interface ChartSectionProps {
  data: ChartData;
  revenueChartData: Array<{ month: string; revenue: number }>;
  statusChartData: Array<{ name: string; value: number; percentage: number; fill?: string }>;
  topClientsData: Array<{ name: string; total_value: number; productions_count: number }>;
  privacyMode: boolean;
}

function ChartSkeleton() {
  return (
    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
      <div className="h-64 bg-slate-900/50 rounded animate-pulse"></div>
    </div>
  );
}

export function ChartSection({
  data,
  revenueChartData,
  statusChartData,
  topClientsData,
  privacyMode
}: ChartSectionProps) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <div className="space-y-8">
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend */}
          <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-50">
                Evolução da Receita
              </h3>
              <div className="h-5 w-5 bg-blue-400 rounded"></div>
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
                    tickFormatter={(value) => {
                      // Formatar valores grandes adequadamente (dados já vêm em reais)
                      if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
                      return `R$ ${value.toFixed(0)}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(30, 41, 59)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      color: 'rgb(248, 250, 252)',
                    }}
                    formatter={(value: any) => {
                      const numValue = typeof value === 'number' ? value : parseFloat(value);
                      return isNaN(numValue) ? ['R$ 0,00', 'Receita'] : [formatCurrency(numValue), 'Receita'];
                    }}
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

          {/* Status Chart */}
          <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-50">
                Produções por Status
              </h3>
              <div className="h-5 w-5 bg-purple-400 rounded"></div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || getStatusColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-50">
              Top Clientes
            </h3>
            <div className="h-5 w-5 bg-emerald-400 rounded"></div>
          </div>
          <div className="space-y-4">
            {topClientsData.map((client, index) => (
              <div key={client.name} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-full text-sm font-medium text-slate-300">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {client.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {client.productions_count} produções
                    </p>
                  </div>
                </div>
                <div className={`text-sm font-medium ${privacyMode ? 'blur-sm select-none' : ''}`}>
                  {formatCurrency(client.total_value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Suspense>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Nomes traduzidos (como chegam do dashboard)
    'Concluída': '#10b981',      // completed - emerald
    'Em Andamento': '#f59e0b',   // in_progress - amber
    'Aprovada': '#3b82f6',       // approved - blue
    'Rascunho': '#6b7280',       // draft - gray
    'Proposta Enviada': '#8b5cf6', // proposal_sent - violet
    'Cancelada': '#ef4444',      // canceled - red

    // Fallback para nomes em inglês (caso necessário)
    'completed': '#10b981',
    'in_progress': '#f59e0b',
    'approved': '#3b82f6',
    'draft': '#6b7280',
    'proposal_sent': '#8b5cf6',
    'canceled': '#ef4444',
  };
  return colors[status] || '#6b7280';
}

function formatCurrency(value: number): string {
  // Converter de centavos para reais (backend retorna valores em centavos)
  const reaisValue = value / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reaisValue);
}
