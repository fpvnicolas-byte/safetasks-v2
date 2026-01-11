'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FullScreenLoader } from '../../components/ui/full-screen-loader';

function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const [isResending, setIsResending] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Verificar se o usuário já está COMPLETAMENTE logado (email confirmado)
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            // Verificar se há conflito de sessão (usuário logado mas email diferente)
            if (session && session.user && email && session.user.email !== email) {
                console.log('⚠️ Conflito de sessão detectado! Fazendo logout...');
                await supabase.auth.signOut();

                // Recheck após logout
                setTimeout(() => {
                    checkUser();
                }, 1000);
                return;
            }

            // Só redirecionar se há sessão E usuário está confirmado
            if (session && session.user && session.user.email_confirmed_at) {
                console.log('✅ Usuário já confirmado, redirecionando para dashboard');
                router.push('/dashboard');
            } else if (session && session.user && !session.user.email_confirmed_at) {
                console.log('⏳ Usuário registrado mas email não confirmado - permanecendo na página');
                // Não faz nada - permanece na página de verify-email
            } else {
                console.log('📧 Nenhum usuário logado - permanecendo na página');
                // Não faz nada - permanece na página de verify-email
            }
        };

        checkUser();

        // Ouvir mudanças de estado de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                // Quando o usuário faz login, redirecionar para dashboard
                router.push('/dashboard');
            }
            if (event === 'TOKEN_REFRESHED') {
                console.log('✅ Token refreshed, session is active');
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const handleResendEmail = async () => {
        if (!email) {
            setMessage('Email não encontrado. Tente fazer login novamente.');
            return;
        }

        setIsResending(true);
        setMessage('');

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) throw error;

            setMessage('Email de confirmação reenviado! Verifique sua caixa de entrada.');
        } catch (error: any) {
            setMessage('Erro ao reenviar email. Tente novamente em alguns minutos.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden font-sans">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[120px] animate-breathing" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-[120px] animate-breathing" style={{ animationDelay: '4s' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Navigation Links */}
                <div className="flex justify-between items-center mb-8 px-2">
                    <Link
                        href="/"
                        className="flex items-center text-slate-400 hover:text-white transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para Início
                    </Link>
                    <Link
                        href="/login"
                        className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
                    >
                        Fazer Login
                    </Link>
                </div>

                <Card className="bg-slate-900/80 border-white/10 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                            <Mail className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">Verifique seu Email</CardTitle>
                        <CardDescription className="text-slate-400">
                            Enviamos um link de confirmação para
                        </CardDescription>
                        <div className="text-emerald-400 font-medium text-lg mt-2 p-3 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                            {email || 'seu email'}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center text-slate-300 space-y-3">
                            <p className="text-sm">
                                📧 Clique no link do email para ativar sua conta e começar a usar o SafeTasks.
                            </p>
                            <p className="text-xs text-slate-400">
                                Não encontrou o email? Verifique sua pasta de spam ou lixo eletrônico.
                            </p>
                            <p className="text-xs text-slate-400">
                                Após clicar no link, você será redirecionado para a página de login.
                            </p>
                        </div>

                        {message && (
                            <div className={`text-sm text-center p-3 rounded-md ${message.includes('Erro') || message.includes('não encontrado')
                                ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                                : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                }`}>
                                {message}
                            </div>
                        )}

                        <div className="space-y-3">
                            <Button
                                onClick={handleResendEmail}
                                disabled={isResending || !email}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11"
                            >
                                {isResending ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Reenviando...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4 mr-2" />
                                        Reenviar Email de Confirmação
                                    </>
                                )}
                            </Button>

                            <div className="text-center">
                                <Link
                                    href="/login"
                                    className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                                >
                                    Já confirmou? Fazer login
                                </Link>
                            </div>
                        </div>

                        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-700">
                            <p>⏳ O link expira em 24 horas.</p>
                            <p>🔒 Após confirmar seu email, faça login com suas credenciais.</p>
                            <p>🚀 Se tiver problemas, clique em "Reenviar Email de Confirmação".</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<FullScreenLoader />}>
            <VerifyEmailForm />
        </Suspense>
    );
}
