# 🏗️ Arquitetura Técnica - SafeTasks V2

## Visão Geral da Arquitetura

SafeTasks V2 é construído seguindo princípios de arquitetura moderna, com foco em escalabilidade, manutenibilidade e experiência do desenvolvedor.

## 🏛️ Princípios Arquiteturais

### 🎯 Design Principles
- **Separation of Concerns**: Camadas bem definidas (API, Business Logic, Data)
- **Single Responsibility**: Cada componente tem uma responsabilidade clara
- **Dependency Inversion**: Interfaces abstratas entre camadas
- **Open/Closed**: Aberto para extensão, fechado para modificação

### 🔧 Technical Principles
- **API-First**: Design centrado nas necessidades dos clientes
- **Performance-First**: Otimizações desde o início
- **Security-First**: Segurança integrada em todas as camadas
- **Testability**: Código projetado para ser testável

## 📊 Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    🖥️  CLIENT LAYER                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 🌐 BROWSER                          │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │           ⚛️  NEXT.JS APP                   │   │   │
│  │  │  ┌─────────┬─────────┬─────────┬─────────┐   │   │   │
│  │  │  │Dashboard│Productions│Calendar│Settings│   │   │   │
│  │  │  └─────────┴─────────┴─────────┴─────────┘   │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   🚀 API GATEWAY LAYER                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                🐍 FASTAPI                             │   │
│  │  ┌─────────┬─────────┬─────────┬─────────┐           │   │
│  │  │  Auth   │Productions│Dashboard│  Users │           │   │
│  │  │         │         │         │         │           │   │
│  │  └─────────┴─────────┴─────────┴─────────┘           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  💾 DATA LAYER                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                 │   │
│  │  │PostgreSQL│ │  Redis  │ │  Files │                 │   │
│  │  │         │ │         │ │         │                 │   │
│  │  └─────────┴─────────┴─────────┴─────────┘           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🐍 Backend Architecture (FastAPI)

### 📁 Estrutura de Diretórios

```
backend/app/
├── api/                    # 🚪 API Layer
│   └── v1/
│       └── endpoints/      # HTTP Endpoints
│           ├── auth.py
│           ├── productions.py
│           ├── dashboard.py
│           └── users.py
├── core/                   # ⚙️ Core Configuration
│   ├── config.py           # Environment & Settings
│   ├── cache.py            # Redis Cache Layer
│   ├── logging_config.py   # Logging Configuration
│   ├── security.py         # Auth & Security
│   └── rate_limit.py       # Rate Limiting
├── models/                 # 🗄️ Data Models
│   ├── user.py            # User, Organization
│   ├── production.py      # Production, Items, Crew
│   ├── client.py          # Clients
│   └── expense.py         # Expenses
├── schemas/                # 📋 Data Validation
│   ├── auth.py            # Login, Tokens
│   ├── production.py      # Production DTOs
│   ├── user.py            # User DTOs
│   └── client.py          # Client DTOs
├── services/               # 🧠 Business Logic
│   ├── production_service.py  # Production calculations
│   └── user_service.py        # User management
└── db/                     # 🗃️ Database Layer
    ├── session.py          # Connection management
    ├── base.py            # Base classes
    └── base_class.py      # SQLAlchemy base
```

### 🏗️ Padrões Arquiteturais

#### Clean Architecture Implementation
```
┌─────────────────────────────────────┐
│         🏛️  ENTITIES              │  # Business Rules
│  (models/, core business logic)    │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│      🧠  USE CASES                │  # Application Rules
│  (services/, business workflows)   │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│    🎭  INTERFACE ADAPTERS         │  # External Interfaces
│  (api/, schemas/, external APIs)   │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│     🔌  FRAMEWORKS & DRIVERS      │  # External Tools
│  (fastapi, sqlalchemy, redis)      │
└─────────────────────────────────────┘
```

#### Dependency Injection
```python
# app/main.py - Dependency injection setup
from app.api.deps import get_current_user, get_current_active_admin
from app.db.session import get_db

@app.post("/productions/", response_model=ProductionResponse)
async def create_production(
    production: ProductionCreate,
    current_user: User = Depends(get_current_active_admin),  # Injected
    db: AsyncSession = Depends(get_db)  # Injected
) -> ProductionResponse:
    # Business logic here
    pass
```

## ⚛️ Frontend Architecture (Next.js)

### 📁 Estrutura de Diretórios

```
frontend/src/
├── app/                     # 🚪 App Router
│   ├── (dashboard)/         # Route Groups
│   │   ├── layout.tsx      # Dashboard Layout
│   │   ├── page.tsx        # Dashboard Home
│   │   └── productions/    # Sub-routes
│   │       └── page.tsx
│   ├── api/                # API Routes (if needed)
│   └── globals.css         # Global Styles
├── components/             # 🧩 Reusable Components
│   ├── ui/                 # Base Components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── dashboard/          # Feature Components
│   │   ├── ChartSection.tsx
│   │   └── ProductionCard.tsx
│   └── forms/              # Form Components
│       └── ProductionForm.tsx
├── lib/                    # 🛠️ Utilities
│   ├── api.ts             # API Client
│   ├── utils.ts           # Helper Functions
│   ├── validations.ts     # Form Validations
│   └── hooks/             # Custom Hooks
└── types/                 # 📝 Type Definitions
    ├── api.ts             # API Response Types
    └── components.ts      # Component Props
```

### 🎨 Design System Architecture

#### Component Composition Pattern
```typescript
// ui/button.tsx - Base component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'btn',
        `btn-${variant}`,
        `btn-${size}`
      )}
      {...props}
    />
  );
}

// dashboard/ProductionCard.tsx - Feature component
interface ProductionCardProps {
  production: Production;
  onEdit: (id: string) => void;
}

export function ProductionCard({ production, onEdit }: ProductionCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{production.title}</h3>
        <Button onClick={() => onEdit(production.id)} size="sm">
          Editar
        </Button>
      </div>
      {/* More content */}
    </Card>
  );
}
```

## 🗄️ Database Architecture

### PostgreSQL Schema Design

#### Entity-Relationship Diagram
```
┌─────────────────┐       ┌─────────────────┐
│   Organization  │       │      User       │
│  ┌────────────┐ │       │  ┌────────────┐ │
│  │ id (PK)    │ │       │  │ id (PK)    │ │
│  │ name       │ │       │  │ email      │ │
│  │ tax_rate   │ │       │  │ full_name  │ │
│  └────────────┘ │       │  │ role       │ │
└─────────────────┘       │  │ org_id (FK)│ │
          │               │  └────────────┘ │
          │               └─────────────────┘
          ▼                        │
┌─────────────────┐               │
│   Production    │               │
│  ┌────────────┐ │               │
│  │ id (PK)    │ │               │
│  │ title      │ │               │
│  │ status     │ │               │
│  │ deadline   │ │               │
│  │ client_id  │◄┼───────────────┘
│  │ org_id (FK)│ │
│  └────────────┘ │
└─────────────────┘
          │
          ▼
┌─────────────────┐       ┌─────────────────┐
│Production Item  │       │ Production Crew │
│  ┌────────────┐ │       │  ┌────────────┐ │
│  │ id (PK)    │ │       │  │ id (PK)    │ │
│  │ prod_id(FK)│ │       │  │ prod_id(FK)│ │
│  │ service_id │ │       │  │ user_id(FK)│ │
│  │ quantity   │ │       │  │ fee        │ │
│  └────────────┘ │       │  └────────────┘ │
└─────────────────┘       └─────────────────┘
```

### Indexing Strategy

#### Performance Indexes
```sql
-- Production searches
CREATE INDEX idx_productions_org_status ON productions(organization_id, status);
CREATE INDEX idx_productions_deadline ON productions(deadline);
CREATE INDEX idx_productions_created_at ON productions(created_at DESC);

-- Foreign key indexes
CREATE INDEX idx_production_items_production ON production_items(production_id);
CREATE INDEX idx_production_crew_production ON production_crew(production_id);
CREATE INDEX idx_production_crew_user ON production_crew(user_id);
```

### Redis Caching Strategy

#### Cache Layers
```typescript
// cache.py - Multi-layer caching
class Cache:
    def get_productions_list(self, org_id: int, role: str) -> Optional[List]:
        """Cache productions list for 5 minutes"""
        key = f"productions:list:{org_id}:{role}"
        return self.get(key)

    def get_dashboard_summary(self, org_id: int) -> Optional[Dict]:
        """Cache dashboard summary for 5 minutes"""
        key = f"dashboard:summary:{org_id}"
        return self.get(key)

    def invalidate_productions(self, org_id: int):
        """Invalidate all production-related caches"""
        self.delete_pattern(f"productions:*:{org_id}:*")
        self.delete(f"dashboard:summary:{org_id}")
```

## 🔄 Data Flow Architecture

### Request Flow
```
1. 🌐 Browser Request
   ↓
2. 🛡️ Next.js Middleware (Auth check)
   ↓
3. ⚛️ React Component (useSWR)
   ↓
4. 📡 API Client (axios/fetch)
   ↓
5. 🚀 FastAPI Endpoint
   ↓
6. 🧪 Pydantic Validation
   ↓
7. 🧠 Business Service
   ↓
8. 💾 SQLAlchemy Query (with eager loading)
   ↓
9. 🗄️ PostgreSQL
   ↓
10. 📊 Response Processing
    ↓
11. 📋 JSON Response
    ↓
12. ⚛️ React State Update
    ↓
13. 🎨 UI Re-render
```

### Caching Flow
```
Request → Redis Check → DB Query → Redis Store → Response
     ↓         ↓              ↓         ↓           ↓
   Cache     Cache Hit     DB Query   Cache Set   Return
   Miss      → Response    → Process  → Continue  Result
   → Continue
```

## 🔒 Security Architecture

### Authentication Flow
```
1. 📝 Login Form
   ↓
2. 🔐 Password Hash (bcrypt)
   ↓
3. 🎫 JWT Token Generation
   ↓
4. 🍪 Cookie Storage (httpOnly)
   ↓
5. 🛡️ Middleware Validation
   ↓
6. 👤 User Context
   ↓
7. 🔒 Permission Checks
```

### Authorization Matrix
```typescript
// Role-based permissions
const PERMISSIONS = {
  admin: ['create', 'read', 'update', 'delete', 'manage_users'],
  crew: ['read', 'update_own_tasks']
};

// Resource-level permissions
const RESOURCE_PERMISSIONS = {
  productions: {
    admin: ['all'],
    crew: ['read_assigned', 'update_status']
  }
};
```

## 📊 Monitoring & Observability

### Logging Strategy
```python
# Structured logging with context
logger.info("Production created", extra={
    "user_id": user.id,
    "org_id": user.organization_id,
    "production_id": production.id,
    "action": "create"
})
```

### Metrics Collection
```python
# app/main.py - Performance monitoring
@app.middleware("http")
async def performance_monitoring(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    logger.info("Request processed", extra={
        "method": request.method,
        "path": request.url.path,
        "status": response.status_code,
        "duration": duration,
        "user_id": getattr(request.state, 'user_id', None)
    })

    response.headers["X-Process-Time"] = str(duration)
    return response
```

## 🚀 Deployment Architecture

### Environment Strategy
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │   Staging       │    │   Production    │
│  ┌────────────┐ │    │  ┌────────────┐ │    │  ┌────────────┐ │
│  │  Local DB  │ │    │  │  Cloud DB  │ │    │  │  Cloud DB  │ │
│  │  No Cache  │ │    │  │  Redis     │ │    │  │  Redis     │ │
│  │  Debug On  │ │    │  │  Full Test │ │    │  │  Optimized │ │
│  └────────────┘ │    │  └────────────┘ │    │  └────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Container Strategy
```dockerfile
# Multi-stage Docker build
FROM python:3.11-slim as builder
# Install Python dependencies
COPY pyproject.toml poetry.lock ./
RUN poetry install --no-dev

FROM node:18-alpine as frontend-builder
# Build Next.js app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM python:3.11-slim as runtime
# Final production image
COPY --from=builder /app /app
COPY --from=frontend-builder /frontend/out /app/static
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔧 Development Workflow

### Local Development
```bash
# Backend
cd backend && poetry run uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev

# Database
docker run -p 5432:5432 postgres:15

# Redis (optional)
docker run -p 6379:6379 redis:7-alpine
```

### Testing Strategy
```bash
# Backend unit tests
poetry run pytest tests/ -v --cov=app

# Frontend unit tests
npm run test -- --coverage

# E2E tests (planned)
npm run test:e2e
```

## 📈 Scalability Considerations

### Horizontal Scaling
- **Stateless API**: Sessions em Redis/JWT
- **Database Connection Pooling**: SQLAlchemy async
- **Load Balancing Ready**: Multiple instances
- **CDN Integration**: Static assets

### Performance Optimizations
- **Query Optimization**: Eager loading, indexes
- **Caching Strategy**: Redis for frequent data
- **CDN**: Static assets delivery
- **Compression**: Gzip responses

---

## 🎯 Architectural Decisions

### Why FastAPI?
- **Async-first**: Melhor performance para I/O operations
- **Type safety**: Pydantic integration
- **Auto-docs**: Swagger/ReDoc generation
- **Modern Python**: Python 3.11+ features

### Why Next.js?
- **Full-stack**: API routes + React
- **SSR/SSG**: SEO e performance
- **TypeScript**: Type safety end-to-end
- **Vercel deployment**: Seamless integration

### Why PostgreSQL?
- **ACID compliance**: Data integrity
- **JSON support**: Flexible schemas
- **Advanced queries**: Window functions, CTEs
- **Extensions**: PostGIS, etc.

### Why Redis?
- **High performance**: In-memory operations
- **Data structures**: Beyond key-value
- **Persistence**: Optional durability
- **Pub/Sub**: Real-time features

---

## 🔄 Future Architecture Evolution

### Planned Improvements
- **GraphQL API**: Flexible queries
- **Microservices**: Domain separation
- **Event Sourcing**: Audit trails
- **CQRS Pattern**: Read/write separation

### Technology Radar
- **Evaluate**: GraphQL, tRPC
- **Trial**: React Server Components
- **Adopt**: Python 3.12, Next.js 15
- **Hold**: Heavy frameworks, complex abstractions

---

*Esta documentação é mantida atualizada com as decisões arquiteturais do projeto.*

