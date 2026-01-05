'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function FAQPage() {
    const faqs = [
        {
            q: "O que é a SafeTasks?",
            a: "A SafeTasks é uma plataforma completa para gestão de produção audiovisual. Ajudamos produtoras a gerenciar finanças, cronogramas e equipes em um só lugar."
        },
        {
            q: "Posso cancelar meu plano a qualquer momento?",
            a: "Sim. A SafeTasks funciona com assinatura mensal sem fidelidade. Você pode cancelar quando quiser, sem multas."
        },
        {
            q: "Como funciona o pagamento?",
            a: "Aceitamos cartões de crédito e PIX. O pagamento é processado de forma segura e a renovação é automática no cartão de crédito."
        },
        {
            q: "Posso adicionar mais colaboradores depois?",
            a: "Claro! Nossos planos permitem adicionar colaboradores conforme sua necessidade. O plano Pro suporta até 100 colaboradores."
        },
        {
            q: "Meus dados estão seguros?",
            a: "Absolutamente. Utilizamos criptografia de ponta a ponta e backups diários para garantir que suas informações financeiras e de produção estejam sempre protegidas."
        }
    ];

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
                    <h1 className="text-4xl font-bold text-white mb-12 text-center">Perguntas Frequentes</h1>

                    <div className="space-y-8">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
                                <h3 className="text-lg font-bold text-white mb-3">{faq.q}</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
