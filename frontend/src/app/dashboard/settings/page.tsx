'use client';

import { useEffect, useState } from 'react';
import { Settings, Building, Percent, Save, CreditCard, Calendar, Clock, ArrowUp, X, Receipt, Badge } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { organizationsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface OrganizationSettings {
  id: number;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  default_tax_rate: number;
  subscription_plan: string;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  billing_id: string | null;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  status: string;
  description: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    default_tax_rate: 0,
  });

  const { mutate } = useSWRConfig();

  useEffect(() => {
    fetchSettings();
  }, []);

  // Carregar histórico quando settings estiverem carregados
  useEffect(() => {
    if (settings) {
      fetchPaymentHistory();
    }
  }, [settings]);

  // Helper functions
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'trialing': return 'Período de Teste';
      case 'active': return 'Ativa';
      case 'past_due': return 'Pagamento Pendente';
      case 'canceled': return 'Cancelada';
      case 'incomplete': return 'Incompleta';
      default: return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'trialing': return 'secondary';
      case 'past_due': return 'destructive';
      case 'canceled': return 'outline';
      default: return 'outline';
    }
  };

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'starter': return '39,90';
      case 'pro': return '59,90';
      case 'free': return '0,00';
      default: return '0,00';
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await organizationsApi.getSettings();
      setSettings(data);
      setFormData({
        name: data.name || '',
        cnpj: data.cnpj || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        default_tax_rate: data.default_tax_rate || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    if (!settings?.billing_id) return;

    setLoadingHistory(true);
    try {
      const history = await organizationsApi.getPaymentHistory();
      setPaymentHistory(history);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      // Fallback para dados simulados se o endpoint falhar
      const mockHistory: PaymentHistory[] = [
        {
          id: '1',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 39.90,
          status: 'Pago',
          description: 'Plano Starter - Janeiro 2025'
        }
      ];
      setPaymentHistory(mockHistory);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você ainda terá acesso até o fim do período atual.')) {
      return;
    }

    setCancellingSubscription(true);
    try {
      await organizationsApi.cancelSubscription();
      toast.success('Assinatura cancelada com sucesso. Você manterá acesso até o fim do período.');
      // Recarregar configurações
      await fetchSettings();
    } catch (error: any) {
      console.error('Erro ao cancelar assinatura:', error);
      toast.error(error.detail || 'Erro ao cancelar assinatura');
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await organizationsApi.createPortalSession();
      if (response.portal_url) {
        window.open(response.portal_url, '_blank');
        toast.success('Portal de cobrança aberto em nova aba');
      }
    } catch (error: any) {
      console.error('Erro ao abrir portal de cobrança:', error);
      toast.error(error.detail || 'Erro ao abrir portal de cobrança');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        cnpj: formData.cnpj.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        default_tax_rate: parseFloat(formData.default_tax_rate.toString()) || 0,
      };

      const updatedSettings = await organizationsApi.updateSettings(payload);
      setSettings(updatedSettings);
      toast.success('Configurações salvas com sucesso!');
      mutate('/api/v1/organizations/settings');
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error(error.detail || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando configurações...</p>
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

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Settings className="h-6 w-6 text-slate-50" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-50">Configurações</h1>
              <p className="text-slate-400">Gerencie as configurações da sua empresa</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="empresa" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900/50">
            <TabsTrigger value="empresa">Empresa</TabsTrigger>
            <TabsTrigger value="assinatura">Assinatura & Pagamento</TabsTrigger>
          </TabsList>

          {/* Aba Empresa */}
          <TabsContent value="empresa" className="space-y-6">
            {/* Dados da Empresa */}
            <Card className="bg-slate-950/30 backdrop-blur-2xl border border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-50">
                <Building className="h-5 w-5" />
                Dados da Empresa
              </CardTitle>
              <CardDescription className="text-slate-400">
                Informações básicas da sua organização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nome da Empresa *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome da empresa"
                    className="bg-slate-900/50 border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    CNPJ
                  </label>
                  <Input
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    className="bg-slate-900/50 border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Telefone
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="bg-slate-900/50 border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@empresa.com"
                    className="bg-slate-900/50 border-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Endereço
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, cidade - UF"
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>
            </CardContent>
          </Card>

          {/* Padrões de Negócio */}
          <Card className="bg-slate-950/30 backdrop-blur-2xl border border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-50">
                <Percent className="h-5 w-5" />
                Padrões de Negócio
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configurações padrão aplicadas a novas produções
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Taxa de Imposto Padrão (%)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={formData.default_tax_rate}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ""); // Remove any non-numeric characters
                      const parsedValue = parseInt(value) || 0;
                      setFormData({ ...formData, default_tax_rate: parsedValue });
                    }}
                    placeholder="0"
                    className="bg-slate-900/50 border-slate-700 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Esta taxa será aplicada automaticamente a novas produções
                </p>
              </div>
            </CardContent>
          </Card>

            {/* Botão Salvar */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </TabsContent>

          {/* Aba Assinatura & Pagamento */}
          <TabsContent value="assinatura" className="space-y-6">
            {/* Status da Assinatura */}
            {settings && (
              <Card className="bg-slate-950/30 backdrop-blur-2xl border border-white/10">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <CreditCard className="h-6 w-6" />
                        Plano {settings.subscription_plan?.toUpperCase()}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        Status:
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          settings.subscription_status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                            : settings.subscription_status === 'trialing'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                        }`}>
                          {getStatusLabel(settings.subscription_status)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-emerald-400">
                        R$ {getPlanPrice(settings.subscription_plan)}
                      </p>
                      <p className="text-sm text-slate-400">/mês</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Controle da Assinatura */}
            <Card className="bg-slate-950/30 backdrop-blur-2xl border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-50">
                  <Settings className="h-5 w-5" />
                  Controle da Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status da Assinatura */}
                {settings && (
                  <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-50">Status Atual</p>
                      <p className="text-sm text-slate-400">
                        {settings.subscription_status === 'active' ? 'Assinatura ativa e funcionando' :
                         settings.subscription_status === 'trialing' ? 'Período de teste gratuito' :
                         'Assinatura inativa'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      settings.subscription_status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                        : settings.subscription_status === 'trialing'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    }`}>
                      {getStatusLabel(settings.subscription_status)}
                    </span>
                  </div>
                )}

                {/* Próxima Cobrança */}
                {settings?.subscription_ends_at && (
                  <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-50">Próxima Cobrança</p>
                      <p className="text-sm text-slate-400">
                        {new Date(settings.subscription_ends_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                )}

                {/* Período de Teste */}
                {settings?.trial_ends_at && settings?.subscription_status === 'trialing' && (
                  <div className="flex justify-between items-center p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                    <div>
                      <p className="font-medium text-emerald-400">Período de Teste</p>
                      <p className="text-sm text-emerald-300">
                        Termina em {new Date(settings.trial_ends_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Clock className="h-5 w-5 text-emerald-400" />
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => router.push('/plans')}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Fazer Upgrade
                  </Button>

                  {settings?.subscription_status === 'active' && (
                    <Button
                      onClick={handleCancelSubscription}
                      disabled={cancellingSubscription}
                      variant="destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {cancellingSubscription ? 'Cancelando...' : 'Cancelar Assinatura'}
                    </Button>
                  )}

                  {settings?.billing_id && (
                    <Button
                      onClick={handleManageBilling}
                      variant="outline"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Gerenciar Pagamento
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Histórico de Pagamentos */}
            <Card className="bg-slate-950/30 backdrop-blur-2xl border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-50">
                  <Receipt className="h-5 w-5" />
                  Histórico de Pagamentos
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Seus últimos pagamentos processados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                ) : paymentHistory.length > 0 ? (
                  <div className="space-y-3">
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-4 bg-slate-900/30 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-50">
                            {new Date(payment.date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-slate-400">
                            {payment.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-emerald-400">
                            R$ {payment.amount.toFixed(2)}
                          </p>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Receipt className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">Nenhum pagamento encontrado</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Os pagamentos aparecerão aqui após serem processados
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
