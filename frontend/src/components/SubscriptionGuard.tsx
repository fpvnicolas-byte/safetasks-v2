'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, CreditCard, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const [isBlocked, setIsBlocked] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handleBlocked = () => {
            setIsBlocked(true);
        };

        window.addEventListener('subscription-blocked', handleBlocked);
        return () => window.removeEventListener('subscription-blocked', handleBlocked);
    }, []);

    const handleGoToPlans = () => {
        setIsBlocked(false);
        router.push('/plans');
    };

    return (
        <>
            {children}

            <Dialog open={isBlocked} onOpenChange={() => { }}>
                <DialogContent className="bg-slate-950/95 border-emerald-500/30 backdrop-blur-2xl sm:max-w-md pointer-events-auto" onPointerDownOutside={(e) => e.preventDefault()}>
                    <DialogHeader className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                            <Lock className="w-8 h-8 text-emerald-500" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-white">Período de Teste Encerrado</DialogTitle>
                        <DialogDescription className="text-slate-400 text-lg">
                            Sua conta está temporariamente bloqueada. Para continuar utilizando o SafeTasks e acessar seus dados, escolha um plano de assinatura.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col space-y-4 pt-6">
                        <Button
                            onClick={handleGoToPlans}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-lg shadow-lg shadow-emerald-500/20 group"
                        >
                            Ver Planos e Assinar
                            <CreditCard className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                        </Button>

                        <p className="text-center text-xs text-slate-500 italic">
                            Seus dados estão salvos e serão liberados instantaneamente após a confirmação do pagamento.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
