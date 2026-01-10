# SafeTasks V2 - Technical Documentation

> **Arquivo Único de Referência** - Leia este documento para entender toda a infraestrutura, arquitetura e guia de desenvolvimento.

---

## 📋 Visão Geral

SafeTasks V2 é uma plataforma SaaS para gestão de produções audiovisuais, construída com arquitetura moderna multi-tenant.

### Stack Tecnológica

| Componente | Tecnologia | Versão/Detalhes |
|------------|------------|-----------------|
| **Frontend** | Next.js | 16.1.1, Standalone Output |
| **Backend** | FastAPI | 0.104.1, Async com Uvicorn |
| **Banco de Dados** | Supabase | PostgreSQL, Porta 6543 (Pooling), AsyncPG |
| **Infraestrutura** | Railway | Nixpacks (Build Automático) |
| **Autenticação** | JWT + Supabase | bcrypt hashing |
| **Pagamentos** | Stripe | Webhooks integrados |
| **ORM** | SQLAlchemy | 2.0.23, async |
| **Validação** | Pydantic | 2.x com Pydantic Settings |

---

## 🏗️ Arquitetura do Sistema

### Diagrama de Fluxo (Railway)

```
┌─────────────────────────────────────────────────────────────────┐
│                    🚂 RAILWAY ORCHESTRATION                     │
│                                                                 │
│  ┌─────────────────────┐     ┌─────────────────────┐           │
│  │   FRONTEND SERVICE  │     │   BACKEND SERVICE   │           │
│  │   Next.js Standalone│     │   FastAPI + Uvicorn │           │
│  │   (Port 3000)       │     │   (Port ${PORT})    │           │
│  └──────────┬──────────┘     └──────────┬──────────┘           │
│             │                           │                       │
│             │    ┌─────────────────────┐                       │
│             └────┤   PRIVATE NETWORK   │                       │
│                  │   (Internal DNS)    │                       │
│                  └─────────────────────┘                       │
│                           │                                     │
│                           ▼                                     │
│                  ┌─────────────────────┐                       │
│                  │   SUPABASE          │                       │
│                  │   PostgreSQL        │                       │
│                  │   (Port 6543)       │                       │
│                  │   Transaction Pooler│                       │
│                  └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### Comunicação

- **Frontend → Backend**: Via URL configurada (`NEXT_PUBLIC_API_URL`)
- **Backend → Banco**: Conexão async via AsyncPG (Supabase Pooler porta 6543)
- **Rede**: Frontend e Backend rodam na mesma rede privada do Railway

---

## 🔧 Variáveis de Ambiente Críticas

### Backend (`backend/.env`)

```bash
# === BANCO DE DADOS ===
# Railway define automaticamente; para local use localhost
DATABASE_URL="postgresql+asyncpg://user:pass@host:6543/db"

# === SEGURANÇA ===
# ⚠️ Mude em produção!
SECRET_KEY="sua-chave-secreta-min-32-caracteres"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# === SUPABASE ===
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_ANON_KEY="anon-key-publica"
SUPABASE_SERVICE_ROLE_KEY="service-role-secreta"
SUPABASE_JWT_SECRET="jwt-secret"

# === CORS (SEGURANÇA) ===
# URLs do frontend separadas por vírgula
BACKEND_CORS_ORIGINS="http://localhost:3000,https://seu-app.railway.app"

# === FRONTEND URL (Redirects) ===
FRONTEND_URL="http://localhost:3000"

# === PAGAMENTOS (STRIPE) ===
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# === LOGS ===
LOG_LEVEL="INFO"
```

### Frontend (`frontend/.env.local`)

```bash
# API do Backend (Produção Railway)
NEXT_PUBLIC_API_URL="https://safetasks-backend-production.up.railway.app"

# Supabase (Client-side)
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="anon-key-publica"
```

---

## 🔐 Segurança & RBAC

### Matriz de Permissões por Role

| Recurso | Operação | Admin | Crew |
|---------|----------|-------|------|
| **Clientes** | GET /clients/ | ✅ | ❌ 403 |
| | POST /clients/ | ✅ | ❌ 403 |
| **Produções** | GET /productions/ | ✅ Todos | ✅ Apenas escalado |
| | GET /productions/{id} | ✅ Completo | ✅ Limitado |
| | POST /productions/ | ✅ | ❌ 403 |
| | PATCH /productions/{id} | ✅ | ❌ 403 |
| | DELETE /productions/{id} | ✅ | ❌ 403 |
| **Equipe** | GET /productions/{id}/crew/ | ✅ Todos | ✅ Apenas si mesmo |
| | POST /productions/{id}/crew/ | ✅ | ❌ 403 |
| | DELETE /productions/{id}/crew/{uid} | ✅ | ❌ 403 |
| **Serviços** | GET /services/ | ✅ Com preços | ✅ Sem preços |
| | POST /services/ | ✅ | ❌ 403 |
| **Dashboard** | GET /dashboard/summary | ✅ Org completo | ✅ Pessoal apenas |

### Blindagem Financeira

- **Admin**: Vê `price` e `fee` de todos
- **Crew**: Vê apenas `name` do serviço, NUNCA preços
- **Crew**: Vê apenas SEU próprio `fee`, nunca de colegas

### CORS (Cross-Origin Resource Sharing)

```python
# backend/app/core/config.py
backend_cors_origins: List[str] = [
    "http://localhost:3000",      # Dev local
    "https://safetasks.railway.app",  # Frontend Railway
]
```

**Regra de Ouro**: Apenas origens explicitamente permitidas podem acessar a API.

---

## 🚀 Deployment (Railway + Nixpacks)

### Como Funciona

1. **Nixpacks** detecta automaticamente a linguagem:
   - Backend: Python (`pyproject.toml` → Poetry)
   - Frontend: Node.js (`package.json` → npm)

2. **Build Automático**:
   ```bash
   # Backend (Railway detecta automaticamente)
   poetry install
   python run.py
   
   # Frontend (via railpack.json)
   rm -rf .next && npm ci && npm run build
   ```

3. **Railpack Config** (`frontend/railpack.json`):
   ```json
   {
     "build": {
       "builder": "RAILPACK",
       "buildCommand": "rm -rf .next && npm ci && npm run build"
     },
     "deploy": {
       "startCommand": "npm start"
     }
   }
   ```

### Variáveis no Railway (Dashboard)

Configure no Railway Variables para cada serviço:

**Backend:**
- `DATABASE_URL` (supabase connection string)
- `SECRET_KEY` (gerar: `openssl rand -hex 32`)
- `BACKEND_CORS_ORIGINS`
- `FRONTEND_URL`
- `SUPABASE_*` keys
- `STRIPE_*` keys

**Frontend:**
- `NEXT_PUBLIC_API_URL` → URL do backend Railway
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Health Check

O backend expõe `/health` endpoint para Railway:

```python
@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    await db.execute(text("SELECT 1"))
    return {"status": "healthy"}
```

---

## 💻 Guia de Desenvolvimento Local

### Pré-requisitos

- Python 3.11+
- Node.js 18+
- Poetry (Python package manager)
- Supabase CLI (opcional, para database local)

### Setup do Backend

```bash
# 1. Entrar no diretório
cd backend

# 2. Instalar dependências
poetry install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas chaves

# 4. Rodar migrations
poetry run alembic upgrade head

# 5. Iniciar servidor (recarrega automaticamente)
poetry run python run.py
# API disponível em: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### Setup do Frontend

```bash
# 1. Entrar no diretório
cd frontend

# 2. Instalar dependências
npm install

# 3. Configurar variáveis
cp supabase-env-example.txt .env.local
# Editar .env.local

# 4. Iniciar em modo desenvolvimento
npm run dev
# App disponível em: http://localhost:3000
```

### Comandos de Banco (Alembic)

```bash
# Criar nova migração
cd backend
poetry run alembic revision -m "descricao_da_migracao"

# Aplicar migrações pendentes
poetry run alembic upgrade head

# Ver migração atual
poetry run alembic current

# Ver histórico de migrações
poetry run alembic history

# Rollback (uma migração)
poetry run alembic downgrade -1

# Rollback (todas)
poetry run alembic downgrade base
```

---

## 📡 Referência da API

### URLs

| Ambiente | URL |
|----------|-----|
| **Produção** | `https://safetasks-backend-production.up.railway.app` |
| **Local** | `http://localhost:8000` |
| **Docs (Swagger)** | `http://localhost:8000/docs` |
| **Docs (ReDoc)** | `http://localhost:8000/redoc` |

### Fluxo de Autenticação

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

**Resposta:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "João Silva",
    "role": "admin",
    "organization_id": 1
  }
}
```

**Usar o token:**
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Endpoints Principais

| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|--------|
| | **Auth** | | |
| POST | `/api/v1/auth/login` | Login com email/senha | Público |
| GET | `/api/v1/auth/register` | Registrar novo usuário | Público |
| GET | `/api/v1/users/me` | Usuário atual | Autenticado |
| | **Produções** | | |
| GET | `/api/v1/productions/` | Lista produções | Todos |
| POST | `/api/v1/productions/` | Criar produção | Admin |
| GET | `/api/v1/productions/{id}` | Detalhes | Todos |
| PATCH | `/api/v1/productions/{id}` | Atualizar | Admin |
| DELETE | `/api/v1/productions/{id}` | Excluir | Admin |
| | **Equipe** | | |
| GET | `/api/v1/productions/{id}/crew/` | Lista equipe | Todos |
| POST | `/api/v1/productions/{id}/crew/` | Adicionar membro | Admin |
| DELETE | `/api/v1/productions/{id}/crew/{uid}` | Remover membro | Admin |
| | **Dashboard** | | |
| GET | `/api/v1/dashboard/summary` | Métricas | Todos |
| | **Serviços** | | |
| GET | `/api/v1/services/` | Lista serviços | Todos |
| POST | `/api/v1/services/` | Criar serviço | Admin |
| | **Clientes** | | |
| GET | `/api/v1/clients/` | Lista clientes | Admin |
| POST | `/api/v1/clients/` | Criar cliente | Admin |

### Códigos de Status

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limit |
| 500 | Internal Error |

---

## 📊 Estrutura de Diretórios

### Backend

```
backend/
├── app/
│   ├── api/v1/endpoints/  # HTTP handlers
│   ├── core/              # Config, Security, Cache
│   ├── db/                # SQLAlchemy setup
│   ├── models/            # Database models
│   ├── schemas/           # Pydantic schemas
│   └── services/          # Business logic
├── alembic/               # Database migrations
├── scripts/               # Utility scripts
└── run.py                 # Entry point (Uvicorn)
```

### Frontend

```
frontend/src/
├── app/                   # Next.js App Router
├── components/            # Reusable components
├── lib/                   # Utilities, API client
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript definitions
```

---

## 🛠️ Troubleshooting

### Problemas Comuns

**1. Erro de CORS**
```
Access to XMLHttpRequest has been blocked by CORS policy
```
→ Verifique `BACKEND_CORS_ORIGINS` no .env do backend

**2. Erro de Conexão com Banco**
```
Could not connect to database
```
→ Verifique `DATABASE_URL` (use porta 6543 para Supabase Pooler)

**3. Token Expirado**
```
401 Unauthorized
```
→ Faça login novamente para novo token

### Logs

- **Railway**: Visualize no dashboard Railway → Deployments → Logs
- **Local**: Console output do terminal

---

## 🔄 Versionamento

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | Jan 2026 | Versão inicial consolidada |

---

**Documentação consolidada em um único arquivo. Para atualizações, edite apenas este arquivo.**
