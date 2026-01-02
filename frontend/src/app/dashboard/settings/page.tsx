'use client';

import { useEffect, useState } from 'react';
import { Settings, Building, Percent, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { organizationsApi } from '@/lib/api';

interface OrganizationSettings {
  id: number;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  default_tax_rate: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-gradient-to-r from-blue-500/8 to-purple-500/8 blur-3xl animate-pulse" />
        <div className="absolute bottom-32 right-32 w-96 h-96 rounded-full bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
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

        <div className="space-y-6">
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
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.default_tax_rate}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsedValue = parseFloat(value);
                      setFormData({ ...formData, default_tax_rate: isNaN(parsedValue) ? 0 : parsedValue });
                    }}
                    placeholder="0.00"
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
        </div>
      </div>
    </div>
  );
}
