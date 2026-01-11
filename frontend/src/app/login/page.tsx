'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { authApi, supabaseAuthApi } from '../../lib/api';
import { ArrowLeft, Film } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Verificar se usuário já está logado ao carregar a página
  useEffect(() => {
    const checkIfAlreadyLoggedIn = async () => {
      try {
        // Verificar se há token armazenado
        const token = localStorage.getItem('token');

        if (!token) {
          setCheckingAuth(false);
          return;
        }

        // ✅ MELHORADO: Timeout para mobile (redes móveis podem ser lentas)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout para mobile

        try {
          // Tentar validar o token fazendo uma chamada protegida
          await authApi.getCurrentUser();
          clearTimeout(timeoutId);

          // Se chegou aqui, o token é válido - redirecionar para dashboard
          router.push('/dashboard');
        } catch (apiError: any) {
          clearTimeout(timeoutId);

          // ✅ MELHORADO: Distinguir entre erros de rede e token inválido
          if (apiError.name === 'AbortError') {
            console.log('Timeout na verificação de autenticação (rede lenta), continuando sem redirecionamento');
          } else if (apiError.response?.status === 401 || apiError.response?.status === 403) {
            console.log('Token inválido detectado, limpando...');
            localStorage.removeItem('token');
            Cookies.remove('token');
          } else {
            console.log('Erro de rede na verificação de autenticação:', apiError.message);
            // Em caso de erro de rede, não limpar token - pode ser problema temporário
          }

          setCheckingAuth(false);
        }

      } catch (error) {
        // Erro geral - permitir login
        console.log('Erro geral na verificação de autenticação:', error);
        setCheckingAuth(false);
      }
    };

    // Verificar mensagens da URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlMessage = urlParams.get('message');

    if (urlMessage === 'email_verification_expired') {
      setMessage('O link de confirmação expirou. Solicite um novo email de confirmação ou tente fazer login novamente.');
    } else if (urlMessage === 'email_confirmed') {
      setMessage('Email confirmado com sucesso! Você pode fazer login agora.');
    }

    // Limpar parâmetros da URL
    if (urlMessage) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, '', newUrl.toString());
    }

    checkIfAlreadyLoggedIn();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ MELHORADO: Timeout para login em mobile (redes móveis podem ser lentas)
      const loginPromise = supabaseAuthApi.login(email, password);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: Login demorou muito. Verifique sua conexão.')), 15000) // 15s timeout
      );

      const response = await Promise.race([loginPromise, timeoutPromise]) as any;

      // ✅ SUPABASE GERENCIA A SESSÃO AUTOMATICAMENTE
      // ✅ INTERCEPTOR PEGA TOKEN DIRETAMENTE DA SESSÃO

      // Store in cookie for middleware (expires in 24 hours)
      Cookies.set('token', response.access_token, {
        expires: 1, // 1 day
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      // ✅ AGUARDAR SESSÃO SER ESTABELECIDA (aumentado para mobile)
      await new Promise(resolve => setTimeout(resolve, 800));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Erro no login:', err);

      // ✅ MELHORADO: Tratamento robusto de erros para mobile
      let errorMessage = 'Erro ao fazer login. Tente novamente.';

      // Network/timeout errors
      if (err.message?.includes('Timeout') || err.message?.includes('Network Error')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (err.message?.includes('fetch')) {
        errorMessage = 'Erro de rede. Verifique sua conexão com a internet.';
      }
      // Authentication errors
      else if (err.message && err.message.includes('Email não confirmado')) {
        errorMessage = 'Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.';
      }
      // API response errors
      else {
        const detail = err.response?.data?.detail;

        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail[0]?.msg || 'Dados de login inválidos';
        } else if (detail) {
          errorMessage = 'Dados de login inválidos';
        } else if (err.response?.status === 429) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
        } else if (err.response?.status >= 500) {
          errorMessage = 'Erro no servidor. Tente novamente em alguns minutos.';
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

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
            href="/plans"
            className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
          >
            Conheça nossos planos
          </Link>
        </div>

        <Card className="bg-slate-900/80 border-white/10 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
              <Film className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Bem-vindo de volta</CardTitle>
            <CardDescription className="text-slate-400">
              Entre na sua conta SafeTasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-200">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-slate-950/50 border-slate-700 text-white focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-medium text-slate-200">
                    Senha
                  </label>
                  <a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">
                    Esqueceu a senha?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500 transition-colors"
                />
              </div>

              {message && (
                <div className="text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
                  {message}
                </div>
              )}

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
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
              Não tem uma conta?{' '}
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Criar conta
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
