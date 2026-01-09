# Configuração do Supabase para SafeTasks

Este guia explica como configurar o Supabase para migrar completamente seu sistema de autenticação e banco de dados.

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto Python com Poetry instalado

## 🚀 Passo 1: Criar Projeto Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em "New Project"
3. Preencha os dados:
   - **Name**: SafeTasks (ou nome de sua preferência)
   - **Database Password**: Escolha uma senha forte
   - **Region**: Selecione a região mais próxima (ex: São Paulo, Brazil)

4. Aguarde a criação do projeto (cerca de 2 minutos)

## 🔑 Passo 2: Obter Credenciais

Após a criação do projeto:

1. Vá para **Settings > API**
2. Anote as seguintes informações:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Para uso no frontend
   - **service_role secret key**: Para uso no backend (NUNCA exponha no frontend)

3. Vá para **Settings > Database**
4. Anote a **Connection string** (para DATABASE_URL)

## 🔐 Passo 3: Configurar JWT Secret

Para validar tokens JWT no backend:

1. Vá para **Settings > API**
2. Role até **JWT Settings**
3. Anote o **JWT Secret** (este é usado para validar tokens)

## 🗄️ Passo 4: Executar Migração do Banco

1. No painel do Supabase, vá para **SQL Editor**
2. Abra o arquivo `supabase_migration.sql` gerado
3. Copie e cole todo o conteúdo no SQL Editor
4. Clique em "Run" para executar a migração

## ⚙️ Passo 5: Configurar Variáveis de Ambiente

1. Copie o arquivo `supabase-config-example.env` para `.env`
2. Preencha com suas credenciais do Supabase:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Database URL (substitua [SERVICE_ROLE_KEY] pela sua service role key)
DATABASE_URL=postgresql://postgres:your-service-role-key@db.your-project-id.supabase.co:5432/postgres
```

## 🔒 Passo 6: Configurar Autenticação no Supabase

1. Vá para **Authentication > Settings**
2. Configure:
   - **Site URL**: `http://localhost:3000` (para desenvolvimento)
   - **Redirect URLs**: Adicione `http://localhost:3000` e sua URL de produção
   - **Enable email confirmations**: Ative se quiser verificação de email

## ✅ Verificação

Após completar todos os passos:

1. Teste a conexão executando:
   ```bash
   poetry run python -c "from app.db.session import get_db; print('✅ Conexão com Supabase OK')"
   ```

2. Verifique se as tabelas foram criadas no **Database > Tables**

## 🔄 Próximos Passos

Com o Supabase configurado, você pode:

1. **Backend**: Atualizar o código para usar autenticação Supabase
2. **Frontend**: Integrar com Supabase Auth
3. **Migração**: Migrar dados existentes (se necessário)

## 🛡️ Segurança

- ✅ Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend
- ✅ Use `SUPABASE_ANON_KEY` apenas para operações públicas
- ✅ Configure Row Level Security (RLS) conforme necessário
- ✅ Use HTTPS em produção

## 📚 Recursos Úteis

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [Documentação Supabase Database](https://supabase.com/docs/guides/database)
- [SDK Python Supabase](https://supabase.com/docs/reference/python)
