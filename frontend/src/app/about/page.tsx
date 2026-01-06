'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '../../components/Footer';

export default function AboutPage() {
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
                    <h1 className="text-4xl font-bold text-white mb-8">Sobre a SafeTasks</h1>

                    <div className="space-y-6 text-slate-300 leading-relaxed text-lg">
                        <p>
                            A SafeTasks nasceu de uma necessidade real: organizar o caos da produção audiovisual.
                            Sabemos que planilhas quebram, e-mails se perdem e o WhatsApp não é lugar de documentar cachês.
                        </p>
                        <p>
                            Nossa missão é simples: oferecer uma plataforma que seja tão fluida quanto o seu processo criativo,
                            mas tão robusta quanto o seu departamento financeiro exige.
                        </p>
                        <p>
                            Combinamos design moderno ("Liquid Glass") com tecnologia de ponta para garantir que produtores,
                            freelancers e clientes estejam sempre na mesma página.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
