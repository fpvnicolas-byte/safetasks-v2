'use client';

import Link from 'next/link';
import { Film, Check, ArrowRight, Shield, Zap, Users } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function LandingPage() {
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
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
          <div className="absolute top-[-100px] left-[-200px] w-[900px] h-[900px] bg-emerald-500/10 rounded-full blur-[120px] animate-breathing" />
          <div className="absolute bottom-[-100px] right-[-200px] w-[1000px] h-[1000px] bg-blue-600/10 rounded-full blur-[120px] animate-breathing" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight leading-tight md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500">
            Sua Produtora, <br />
            <span className="text-emerald-400">Finalmente Organizada.</span>
          </h1>
          <p className="mb-10 text-lg font-normal text-slate-400 lg:text-xl sm:px-16 lg:px-48">
            Gestão financeira, cronogramas de filmagem e comunicação com a equipe em uma única plataforma.
            Sem planilhas quebradas, sem caos.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25 group"
            >
              Começar Agora
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-slate-300 bg-slate-900/50 border border-white/10 rounded-xl hover:bg-slate-800 transition-all backdrop-blur-sm"
            >
              Ver Planos
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Gestão Financeira",
                desc: "Controle orçamentos, cachês e despesas em tempo real. Saiba exatamente quanto cada produção lucrou."
              },
              {
                icon: Zap,
                title: "Cronogramas Ágeis",
                desc: "Organize diárias de filmagem e notifique sua equipe automaticamente. Chega de PDFs desatualizados."
              },
              {
                icon: Users,
                title: "Acesso da Equipe",
                desc: "Convide freelancers e colaboradores com permissões limitadas. Eles veem o que precisam, você mantém o controle."
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 bg-slate-900/30 border border-white/5 rounded-2xl hover:border-emerald-500/30 hover:bg-slate-900/50 transition-all group">
                <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Planos Simples e Transparentes</h2>
            <p className="text-slate-400">Escolha o tamanho ideal para a sua produtora.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <div className="p-8 bg-slate-900/30 border border-white/10 rounded-3xl hover:border-emerald-500/30 transition-all relative overflow-hidden">
              <h3 className="text-xl font-medium text-slate-300 mb-2">Starter</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-5xl font-extrabold text-white">R$ 39,90</span>
                <span className="text-slate-500 ml-2">/mês</span>
              </div>
              <p className="text-slate-400 mb-8">Perfeito para pequenas produtoras e freelancers organizados.</p>

              <ul className="space-y-4 mb-8">
                {[
                  "Clientes Ilimitados",
                  "Até 5 Colaboradores",
                  "Projetos Ilimitados",
                  "Suporte por Chat"
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300">
                    <Check className="w-5 h-5 text-emerald-500 mr-3" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/register?plan=starter"
                className="block w-full py-3 px-6 text-center rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
              >
                Escolher Starter
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-8 bg-gradient-to-b from-emerald-900/20 to-slate-900/30 border border-emerald-500/30 rounded-3xl relative overflow-hidden transform md:-translate-y-4">
              <div className="absolute top-0 right-0 bg-emerald-500 text-xs font-bold px-3 py-1 text-slate-950 rounded-bl-xl">
                MAIS POPULAR
              </div>
              <h3 className="text-xl font-medium text-emerald-400 mb-2">Pro</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-5xl font-extrabold text-white">R$ 59,90</span>
                <span className="text-slate-500 ml-2">/mês</span>
              </div>
              <p className="text-slate-400 mb-8">Para produtoras em crescimento que precisam de mais poder.</p>

              <ul className="space-y-4 mb-8">
                {[
                  "Clientes Ilimitados",
                  "Até 20 Colaboradores",
                  "Projetos Ilimitados",
                  "Relatórios Financeiros",
                  "Suporte Prioritário"
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300">
                    <Check className="w-5 h-5 text-emerald-400 mr-3" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/register?plan=pro"
                className="block w-full py-3 px-6 text-center rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Escolher Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
