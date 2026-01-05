import Link from 'next/link';

export function Footer() {
    return (
        <footer className="py-12 border-t border-white/5 bg-slate-950">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-slate-500 text-sm">
                    © {new Date().getFullYear()} SafeTasks. Todos os direitos reservados.
                </div>
                <div className="flex gap-6">
                    <Link href="/about" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">
                        Sobre Nós
                    </Link>
                    <Link href="/faq" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">
                        FAQ
                    </Link>
                    <Link href="/privacy" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">
                        Política de Privacidade
                    </Link>
                </div>
            </div>
        </footer>
    );
}
