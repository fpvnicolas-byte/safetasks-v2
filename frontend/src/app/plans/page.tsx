'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Film, Check, ArrowRight, Shield, Zap, Users, Building2 } from 'lucide-react';
import { Footer } from '../../components/Footer';
import { organizationsApi } from './src/lib/api';
import { toast } from 'sonner';

export default function PlansPage() {
    const router = useRouter();
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // Verificar autenticação ao carregar a página
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Tentar fazer uma chamada que requer autenticação
                await organizationsApi.getSettings();
                setIsAuthenticated(true);
            } catch (error) {
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    const handleSubscribe = async (plan: string) => {
        // Se não estiver autenticado, redirecionar para registro
        if (!isAuthenticated) {
            router.push(`/register?plan=${plan}`);
            return;
        }

        // Se estiver autenticado, continuar com checkout normal
        setLoading(prev => ({ ...prev, [plan]: true }));
        try {
            const successUrl = `${window.location.origin}/dashboard?subscription=success`;
            const cancelUrl = `${window.location.origin}/plans?subscription=cancelled`;

            const response = await organizationsApi.createCheckoutSession({
                plan: plan,
                success_url: successUrl,
                cancel_url: cancelUrl,
            });

            if (response.checkout_url) {
                router.push(response.checkout_url);
            } else {
                toast.error("Erro ao iniciar o checkout. Tente novamente.");
            }
        } catch (error) {
            console.error("Error creating checkout session:", error);
            toast.error("Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.");
        } finally {
            setLoading(prev => ({ ...prev, [plan]: false }));
        }
    };

    // Renderizar loading enquanto verifica autenticação
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Verificando autenticação...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30">
            {/* Navigation */}
            <nav className="fixed w-full z-50 top-0 start-0 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between px-6 py-4">
                    <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg shadow-lg shadow-emerald-500/20">
                            <Film className="h-6 w-6 text-white" />
                        </div>
                        <span className="self-center text-2xl font-bold whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            SafeTasks
                        </span>
                    </Link>
                    <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
                        <Link
                            href="/login"
                            className="text-white bg-slate-800 hover:bg-slate-700 focus:ring-4 focus:outline-none focus:ring-slate-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-all border border-white/10 hover:border-emerald-500/50"
                        >
                            Entrar
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-10 lg:pt-48 lg:pb-20 overflow-hidden text-center">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-0 left-10 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-tight md:text-6xl text-white">
                        Planos que cabem no seu orçamento
                    </h1>
                    <p className="mb-8 text-lg font-normal text-slate-400 lg:text-xl sm:px-16 lg:px-48">
                        Comece pequeno, cresça rápido. Mude de plano a qualquer momento.
                    </p>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pb-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Starter Plan */}
                        <div className="p-8 bg-slate-900/30 border border-white/10 rounded-3xl hover:border-emerald-500/30 transition-all flex flex-col">
                            <h3 className="text-xl font-medium text-slate-300 mb-2">Starter</h3>
                            <div className="flex items-baseline mb-6">
                                <span className="text-4xl font-extrabold text-white">R$ 39,90</span>
                                <span className="text-slate-500 ml-2">/mês</span>
                            </div>
                            <p className="text-slate-400 mb-8">O essencial para freelancers e pequenas produtoras.</p>

                            <ul className="space-y-4 mb-8 flex-1">
                                {[
                                    "Clientes Ilimitados",
                                    "Até 5 Colaboradores",
                                    "Projetos Ilimitados",
                                    "Suporte por Chat"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center text-slate-300">
                                        <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe("starter")}
                                className="block w-full py-3 px-6 text-center rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
                                disabled={loading.starter}
                            >
                                {loading.starter ? "Processando..." : "Escolher Starter"}
                            </button>
                        </div>

                        {/* Pro Plan */}
                        <div className="p-8 bg-gradient-to-b from-emerald-900/20 to-slate-900/30 border border-emerald-500/30 rounded-3xl relative overflow-hidden transform md:-translate-y-4 flex flex-col shadow-2xl shadow-emerald-900/20">
                            <div className="absolute top-0 right-0 bg-emerald-500 text-xs font-bold px-3 py-1 text-slate-950 rounded-bl-xl">
                                RECOMENDADO
                            </div>
                            <h3 className="text-xl font-medium text-emerald-400 mb-2">Pro</h3>
                            <div className="flex items-baseline mb-6">
                                <span className="text-4xl font-extrabold text-white">R$ 59,90</span>
                                <span className="text-slate-500 ml-2">/mês</span>
                            </div>
                            <p className="text-slate-400 mb-8">Potência total para produtoras em expansão.</p>

                            <ul className="space-y-4 mb-8 flex-1">
                                {[
                                    "Clientes Ilimitados",
                                    "Até 20 Colaboradores",
                                    "Projetos Ilimitados",
                                    "Relatórios Financeiros",
                                    "Gestão de Equipe",
                                    "Suporte Prioritário (Email e Chat)"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center text-slate-300">
                                        <Check className="w-5 h-5 text-emerald-400 mr-3 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe("pro")}
                                className="block w-full py-3 px-6 text-center rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                                disabled={loading.pro}
                            >
                                {loading.pro ? "Processando..." : "Escolher Pro"}
                            </button>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="p-8 bg-slate-900/30 border border-purple-500/20 rounded-3xl hover:border-purple-500/40 transition-all flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
                            <h3 className="text-xl font-medium text-purple-300 mb-2">Enterprise</h3>
                            <div className="flex items-baseline mb-6">
                                <span className="text-4xl font-extrabold text-white">Sob Consulta</span>
                            </div>
                            <p className="text-slate-400 mb-8">Soluções customizadas para grandes operações.</p>

                            <ul className="space-y-4 mb-8 flex-1">
                                {[
                                    "Clientes Ilimitados",
                                    "Colaboradores Ilimitados",
                                    "API Dedicada",
                                    "SLA Garantido",
                                    "Gerente de Contas",
                                    "Treinamento da Equipe"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center text-slate-300">
                                        <Check className="w-5 h-5 text-purple-400 mr-3 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <a
                                href="mailto:contato@safetasks.com?subject=Interesse%20no%20Plano%20Enterprise"
                                className="block w-full py-3 px-6 text-center rounded-xl border border-purple-500/30 text-purple-300 font-medium hover:bg-purple-500/10 transition-colors"
                            >
                                Fale Conosco
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
