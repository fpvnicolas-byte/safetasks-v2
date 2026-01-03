'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login(email, password);

      // Store token securely in both localStorage and cookie
      const token = response.access_token;
      localStorage.setItem('token', token);

      // Store in cookie for middleware (expires in 24 hours)
      Cookies.set('token', token, {
        expires: 1, // 1 day
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;

      // FastAPI can return detail as string or array of objects
      let errorMessage = 'Erro ao fazer login';

      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        // If it's an array of validation errors, get the first one
        errorMessage = detail[0]?.msg || 'Dados de login inválidos';
      } else if (detail) {
        errorMessage = 'Dados de login inválidos';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">SafeTasks</CardTitle>
          <CardDescription>
            Entre na sua conta para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
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
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground uppercase font-bold">
            <p>Registrar ainda não desenvolvido</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
