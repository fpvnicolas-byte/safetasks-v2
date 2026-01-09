# Integração Supabase Auth - Frontend (@supabase/ssr)

Este documento explica como configurar e usar o Supabase Auth no frontend da aplicação SafeTasks usando `@supabase/ssr`.

## 📋 Pré-requisitos

1. Projeto Supabase configurado (veja `backend/SUPABASE_SETUP.md`)
2. SDK do Supabase SSR instalado: `npm install @supabase/ssr`

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto frontend com:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Supabase Configuration (Public keys - safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://etudhptqfgughhlfawif.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_94--ZhFfVI5-NnDyCy4Pow_k2HEmoLY
```

### 2. Arquivos de Configuração

Os arquivos principais para a integração Supabase são:

- `utils/supabase/client.ts` - Cliente Supabase para browser
- `utils/supabase/server.ts` - Cliente Supabase para Server Components
- `utils/supabase/middleware.ts` - Cliente Supabase para middleware
- `src/lib/supabase.ts` - Funções auxiliares de auth
- `src/lib/api.ts` - API atualizada com endpoints Supabase
- `src/middleware.ts` - Middleware atualizado para Supabase
- `src/app/verify-email/page.tsx` - Página de verificação de email
- `src/app/login/page.tsx` - Login com mensagens de verificação
- `src/app/register/page.tsx` - Registro redirecionando para verificação

## 🔧 Como Usar

### Fluxo de Verificação de Email

1. **Registro**: Usuário preenche formulário → Redirecionado para `/verify-email`
2. **Verificação**: Página mostra email e permite reenviar confirmação
3. **Confirmação**: Usuário clica no link do email → Redirecionado para `/login`
4. **Login**: Usuário pode fazer login normalmente

### Autenticação Básica

```typescript
import { supabaseAuthApi } from '@/lib/api';

// Login
const login = async (email: string, password: string) => {
  try {
    const result = await supabaseAuthApi.login(email, password);
    // Tokens são automaticamente armazenados
    console.log('Login successful:', result.user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Registro
const register = async (userData) => {
  try {
    const result = await supabaseAuthApi.registerOwner(userData);
    // Se auto-login estiver habilitado, usuário já estará logado
    console.log('Registration successful');
  } catch (error) {
    console.error('Registration failed:', error);
  }
};

// Logout
const logout = async () => {
  try {
    await supabaseAuthApi.logout();
    // Tokens são limpos automaticamente
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

### Estado de Autenticação

```typescript
import { supabaseAuthApi } from '@/lib/api';

const checkAuthState = async () => {
  // Verificar sessão atual
  const { session, error } = await supabaseAuthApi.getCurrentSession();
  if (session) {
    console.log('User is logged in:', session.user);
  }

  // Ouvir mudanças no estado de autenticação
  const { data: { subscription } } = supabaseAuthApi.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
  });

  // Não esqueça de cancelar a inscrição quando o componente for desmontado
  return () => subscription.unsubscribe();
};
```

### Recuperação de Senha

```typescript
import { supabaseAuthApi } from '@/lib/api';

// Enviar email de recuperação
const resetPassword = async (email: string) => {
  try {
    const { error } = await supabaseAuthApi.resetPassword(email);
    if (!error) {
      console.log('Password reset email sent');
    }
  } catch (error) {
    console.error('Password reset failed:', error);
  }
};
```

## 🧪 Testes

### Testes E2E com Playwright

Os testes foram atualizados para incluir funções Supabase:

```typescript
import { loginAsTestUserSupabase, registerTestUserSupabase } from '../tests/e2e/auth-helper';

// Teste de login Supabase
test('user can login with Supabase', async ({ page }) => {
  await loginAsTestUserSupabase(page, 'user@example.com', 'password');
  // Verificações...
});

// Teste de registro Supabase
test('user can register with Supabase', async ({ page }) => {
  const userData = {
    organization_name: 'Test Studio',
    full_name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };

  const result = await registerTestUserSupabase(page, userData);
  // Verificações...
});
```

## 🔄 Migração de Código Existente

### Antes (API antiga)
```typescript
import { authApi } from '@/lib/api';

const response = await authApi.login(email, password);
const token = response.access_token;
```

### Depois (Supabase)
```typescript
import { supabaseAuthApi } from '@/lib/api';

const response = await supabaseAuthApi.login(email, password);
const token = response.access_token; // Mesmo formato, mas gerado pelo Supabase
```

## 🛡️ Segurança

### Tokens JWT
- Os tokens JWT do Supabase são automaticamente validados no backend
- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` apenas para operações públicas
- Nunca exponha chaves de serviço no frontend

### Sessões
- As sessões são automaticamente persistidas pelo Supabase
- Use `supabase.auth.getSession()` para verificar estado de autenticação
- O middleware Next.js foi atualizado para trabalhar com tokens Supabase

## 📧 Fluxo de Email Confirmation

### Como Funciona:

1. **Registro** → Usuário criado no Supabase (não confirmado)
2. **Email enviado** → Link de confirmação enviado automaticamente
3. **Redirecionamento** → Usuário vai para `/verify-email`
4. **Confirmação** → Usuário clica no link do email
5. **Login** → Agora funciona normalmente

### Estados de Registro:

```typescript
// ✅ EMAIL CONFIRMATION HABILITADO (Produção)
{
  success: true,
  requiresEmailConfirmation: true,
  user: { ... },
  email: "user@example.com"
}

// ✅ EMAIL CONFIRMATION DESABILITADO (Dev)
{
  success: true,
  session: { ... },
  user: { ... }
}
```

### Tratamento de Erros no Login:

```typescript
// Quando email não confirmado
throw new Error('Email não confirmado. Verifique sua caixa de entrada...');

// Quando credenciais inválidas
throw new Error('Email ou senha incorretos');
```

## 🔄 Migração dos Endpoints

**Após migração para Supabase, atualize suas chamadas:**

```typescript
// ❌ ANTIGO - Não funciona mais após migração
authApi.getCurrentUser() // → /users/me (JWT antigo)

// ✅ NOVO - Use este para Supabase
supabaseAuthApi.getCurrentUserProfile() // → /users/supabase/me (Supabase JWT)
```

### Gerenciamento de Tokens:

**Após migração, os tokens são gerenciados automaticamente:**

```typescript
// ✅ INTERCEPTOR PEGA TOKEN DIRETAMENTE DA SESSÃO SUPABASE
// ✅ CORREÇÃO: Usa Promise para evitar problemas de async
api.interceptors.request.use((config) => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
        resolve(config);
      }).catch((error) => {
        console.error('Erro ao obter sessão Supabase:', error);
        resolve(config);
      });
    } else {
      resolve(config);
    }
  });
});
```

### Endpoints Atualizados:

| Função | Endpoint Antigo | Endpoint Novo |
|--------|----------------|---------------|
| `getCurrentUser()` | `/users/me` | `/users/supabase/me` |
| `registerOwner()` | `/auth/register-owner` | `/auth/supabase/register-owner` |
| `login()` | `/auth/login` | `/auth/supabase/login` |
| `logout()` | N/A | `/auth/supabase/logout` |

## 🔧 Troubleshooting

### Problema: "Supabase client not configured"
```
Error: Supabase configuration is missing. Please check your environment variables.
```

**Solução:** Verifique se as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão definidas.

### Problema: Login falha
- Verifique se o usuário existe no Supabase Auth
- Confirme se a senha está correta
- Verifique os logs do backend para erros de validação

### Problema: Tokens expiram rapidamente
- Configure `autoRefreshToken: true` no cliente Supabase (já configurado)
- Implemente refresh automático de tokens se necessário

### Problema: Erro 401 após login
- Verifique se o interceptor está funcionando corretamente
- Confirme que `supabase.auth.getSession()` retorna uma sessão válida
- Certifique-se de que o delay de 500ms no login é suficiente
- Verifique logs do console para erros no interceptor

### Problema: Email confirmation não funciona
- Certifique-se de que "Enable email confirmations" está habilitado no Supabase
- Verifique se o email do usuário foi confirmado antes do login
- Use a página `/verify-email` para orientar o usuário
- Teste com email confirmation desabilitado primeiro (modo dev)

## 📚 Recursos Adicionais

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [SDK JavaScript Supabase](https://supabase.com/docs/reference/javascript)
- [Exemplos de autenticação](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
