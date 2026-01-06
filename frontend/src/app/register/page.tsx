'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { authApi } from './src/lib/api';
import { Toaster, toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan') || 'starter';

    const [formData, setFormData] = useState({
        organization_name: '',
        full_name: '',
        email: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authApi.registerOwner(formData);
            toast.success('Conta criada com sucesso! Faça login para continuar.');
            router.push('/login');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            let errorMessage = 'Erro ao criar conta';

            if (typeof detail === 'string') {
                errorMessage = detail;
            } else if (Array.isArray(detail)) {
                errorMessage = detail[0]?.msg || 'Dados inválidos';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-slate-900/80 border-white/10 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white">Criar Nova Produtora</CardTitle>
                <CardDescription className="text-slate-400">
                    Plano selecionado: <span className="capitalize text-emerald-400 font-medium">{plan}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="organization_name" className="text-sm font-medium text-slate-200">
                            Nome da Produtora
                        </label>
                        <Input
                            id="organization_name"
                            placeholder="Ex: Studio Criativo"
                            value={formData.organization_name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="bg-slate-950/50 border-slate-700 text-white focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="full_name" className="text-sm font-medium text-slate-200">
                            Seu Nome Completo
                        </label>
                        <Input
                            id="full_name"
                            placeholder="Ex: João Silva"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="bg-slate-950/50 border-slate-700 text-white focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-slate-200">
                            Email Profissional
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="joao@studiocriativo.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="bg-slate-950/50 border-slate-700 text-white focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-slate-200">
                            Senha de Acesso
                        </label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={8}
                            disabled={loading}
                            className="bg-slate-950/50 border-slate-700 text-white focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-3">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11"
                        disabled={loading}
                    >
                        {loading ? 'Criando conta...' : 'Começar Gratuitamente'}
                    </Button>

                    <div className="text-center text-sm text-slate-400 mt-4">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                            Faça login
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden font-sans">
            <Toaster position="top-right" />

            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] animate-breathing" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] animate-breathing" style={{ animationDelay: '4s' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Navigation Link */}
                <div className="flex mb-8 px-2">
                    <Link
                        href="/"
                        className="flex items-center text-slate-400 hover:text-white transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para Início
                    </Link>
                </div>

                <Suspense fallback={<div className="text-white text-center">Carregando formulário...</div>}>
                    <RegisterForm />
                </Suspense>
            </div>
        </div>
    );
}
