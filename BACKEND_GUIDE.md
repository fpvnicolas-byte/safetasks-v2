# Backend Guide - SafeTasks V2

## Stack

| Componente | Tecnologia |
|------------|------------|
| Runtime | Python 3.11+ |
| Framework | FastAPI 0.104.1 |
| ASGI Server | Uvicorn 0.40.0 |
| ORM | SQLAlchemy 2.0.23 |
| Migrações | Alembic 1.12.1 |
| Banco | PostgreSQL + AsyncPG (Supabase) |
| Validação | Pydantic + Pydantic-Settings |

## Variáveis de Ambiente

```bash
# Banco de Dados (Supabase - conexão direta)
DATABASE_URL=postgresql://postgres:password@host:6543/postgres?sslmode=require

# Supabase Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Segurança
SECRET_KEY=your-secret-key-here

# Stripe Pagamentos
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Sistema
FRONTEND_URL=https://safetasks.vercel.app
LOG_LEVEL=INFO
TRIAL_PERIOD_DAYS=7
```

## Desenvolvimento Local

```bash
cd backend
poetry install
poetry run python run.py
```

API disponível em: `http://localhost:8000`

Documentação automática:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Deploy (Railway + Nixpacks)

O backend é deployado automaticamente via Railway usando **Nixpacks** (sem Dockerfile).

**Build Command:** `poetry build`  
**Start Command:** `python run.py`

Variáveis configuradas no Railway Dashboard:
- `PORT` (automático)
- `DATABASE_URL` (Supabase connection string)
- `SECRET_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `FRONTEND_URL`

## Endpoints API

| Módulo | Arquivo | Rota Base |
|--------|---------|-----------|
| Auth | `auth.py` | `/api/v1/auth` |
| Clients | `clients.py` | `/api/v1/clients` |
| Dashboard | `dashboard.py` | `/api/v1/dashboard` |
| Expenses | `expenses.py` | `/api/v1/expenses` |
| Organizations | `organizations.py` | `/api/v1/organizations` |
| Production Crew | `production_crew.py` | `/api/v1/production-crew` |
| Production Items | `production_items.py` | `/api/v1/production-items` |
| Productions | `productions.py` | `/api/v1/productions` |
| Services | `services.py` | `/api/v1/services` |
| Users | `users.py` | `/api/v1/users` |
| Webhooks | `webhooks.py` | `/api/v1/webhooks` |

## Arquitetura

```
backend/
├── app/
│   ├── api/v1/endpoints/  # Routers FastAPI
│   ├── core/              # Config, Security, Logging, Rate Limit, Cache
│   ├── db/                # Session, Base, Engine
│   ├── models/            # SQLAlchemy Models
│   ├── schemas/           # Pydantic Schemas
│   └── services/          # Business Logic
├── alembic/               # Migrações DB
├── scripts/               # Utilities
└── run.py                 # Entry point (Railway compatible)
```

## Migrações (Alembic)

```bash
# Criar nova migração
cd backend
poetry run alembic revision -m "description"

# Aplicar migrações
poetry run alembic upgrade head

# Ver status
poetry run alembic current
```

## Banco de Dados

- **Host:** Supabase (projeto dedicado)
- **Porta:** 6543 (Supabase pooler) ou 5432 (direto)
- **Driver:** asyncpg (assíncrono)
- **Pool:** configurado via SQLAlchemy

## Documentação Adicional

- [API Details](./docs/api.md)
- [Architecture](./docs/architecture.md)
