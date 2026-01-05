'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30 flex flex-col">
            {/* Navbar */}
            <nav className="fixed w-full z-50 top-0 start-0 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between px-6 py-4">
                    <Link href="/" className="flex items-center space-x-3 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Voltar</span>
                    </Link>
                </div>
            </nav>

            <main className="flex-1 pt-32 pb-20">
                <div className="max-w-3xl mx-auto px-6">
                    <h1 className="text-4xl font-bold text-white mb-8">Política de Privacidade</h1>

                    <div className="space-y-6 text-slate-300 leading-relaxed">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white">1. Coleta de Dados</h2>
                            <p>
                                Coletamos apenas as informações necessárias para a prestação dos nossos serviços, incluindo nome,
                                e-mail e dados da produtora. Não compartilhamos seus dados pessoais com terceiros para fins publicitários.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white">2. Segurança</h2>
                            <p>
                                Utilizamos protocolos de segurança padrão da indústria (como criptografia SSL/TLS) para proteger
                                suas informações durante a transmissão e armazenamento.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white">3. Seus Direitos</h2>
                            <p>
                                Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento.
                                Para exercer esses direitos, entre em contato com nosso suporte.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white">4. Cookies</h2>
                            <p>
                                Utilizamos cookies essenciais para manter sua sessão segura e melhorar a experiência de navegação.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
