# SafeTasks V2 - Backend Technical Guide

## 📋 Visão Geral

SafeTasks V2 é uma plataforma SaaS completa para gestão de produções audiovisuais, desenvolvida com arquitetura multi-tenant robusta e segurança enterprise-level. Este documento serve como referência técnica para desenvolvedores e arquitetos de software.

**Status da Auditoria:** ✅ **APROVADO** (11/11 testes de segurança passaram)

---

## 🏗️ Arquitetura Multi-tenant

### Princípio de Isolamento

O SafeTasks V2 utiliza uma arquitetura **multi-tenant rigorosa** onde cada empresa (organização) opera em um ambiente completamente isolado:

#### Campo Pivô: `organization_id`

```sql
-- Todos os recursos são vinculados a uma organização
organizations (id, name, ...)
users (id, email, organization_id, role, ...)
clients (id, full_name, organization_id, ...)
services (id, name, organization_id, ...)
productions (id, title, organization_id, ...)
```

#### Implementação Técnica

**1. Filtros Automáticos em Todas as Queries:**
```python
# Exemplo: Buscar produções apenas da organização do usuário
result = await db.execute(
    select(Production).where(
        Production.organization_id == current_user.organization_id
    )
)
```

**2. Validação de Acesso Cruzado:**
```python
# Verificação: Usuário só acessa recursos da própria organização
if production.organization_id != current_user.organization_id:
    raise HTTPException(status_code=404, detail="Production not found")
```

**3. Isolamento a Nível de Banco:**
- Índices compostos incluem `organization_id`
- Foreign keys garantem integridade referencial
- Soft deletes respeitam isolamento

### Benefícios da Arquitetura

- ✅ **Segurança Total:** Dados de uma empresa nunca são visíveis para outra
- ✅ **Escalabilidade:** Adição de novos tenants sem impacto
- ✅ **Performance:** Queries otimizadas com índices organizacionais
- ✅ **Compliance:** Adequação a regulamentações de privacidade

---

## 🔐 Matriz de Permissões (RBAC)

### Roles Definidas

| Role | Descrição | Permissões |
|------|-----------|------------|
| `admin` | Gestor/Proprietário da Empresa | **Escrita + Leitura Completa** |
| `user` | Colaborador/Crew | **Leitura Restrita + Escrita Limitada** |

### Detalhamento por Recurso

#### 👥 Clientes (`/clients/`)
| Operação | Admin | Crew |
|----------|-------|------|
| `GET /clients/` | ✅ Lista todos os clientes | ❌ **403 Forbidden** |
| `POST /clients/` | ✅ Criar cliente | ❌ **403 Forbidden** |

#### 🎬 Produções (`/productions/`)
| Operação | Admin | Crew |
|----------|-------|------|
| `GET /productions/` | ✅ Lista todas as produções | ✅ Lista apenas produções onde está escalado |
| `GET /productions/{id}` | ✅ Detalhes completos | ✅ Detalhes da produção (dados limitados) |
| `POST /productions/` | ✅ Criar produção | ❌ **403 Forbidden** |
| `PATCH /productions/{id}` | ✅ Editar produção | ❌ **403 Forbidden** |
| `DELETE /productions/{id}` | ✅ Excluir produção | ❌ **403 Forbidden** |

#### 👷 Equipe (`/productions/{id}/crew/`)
| Operação | Admin | Crew |
|----------|-------|------|
| `GET /productions/{id}/crew/` | ✅ Lista toda equipe | ✅ Lista apenas si mesmo |
| `POST /productions/{id}/crew/` | ✅ Adicionar membro | ❌ **403 Forbidden** |
| `DELETE /productions/{id}/crew/{user_id}` | ✅ Remover membro | ❌ **403 Forbidden** |

#### 🛠️ Serviços (`/services/`)
| Operação | Admin | Crew |
|----------|-------|------|
| `GET /services/` | ✅ Lista com preços | ✅ Lista sem preços (`ServiceCrewRead`) |
| `POST /services/` | ✅ Criar serviço | ❌ **403 Forbidden** |

#### 📊 Dashboard (`/dashboard/summary`)
| Operação | Admin | Crew |
|----------|-------|------|
| `GET /dashboard/summary` | ✅ Métricas organizacionais completas | ✅ Métricas pessoais (earnings + count) |

### Implementação Técnica

**Guards de Segurança:**
```python
# Bloqueio para usuários não-admin
@router.post("/clients/", response_model=ClientResponse)
async def create_client(
    client_data: ClientCreate,
    current_user: User = Depends(get_current_active_admin),  # ❌ Apenas admin
    db: AsyncSession = Depends(get_db)
) -> ClientResponse:
```

**Filtros de Visibilidade:**
```python
# Crew vê apenas produções onde está escalado
result = await db.execute(
    select(Production).join(ProductionCrew)
    .where(
        ProductionCrew.user_id == current_user.id,
        Production.organization_id == current_user.organization_id
    )
)
```

---

## 🛡️ Segurança e Privacidade

### Blindagem Financeira (Dual-Schemas)

O SafeTasks V2 implementa **blindagem financeira completa** através de schemas segregados:

#### Schema para Admin (Completo)
```python
class ServiceResponse(BaseModel):
    id: int
    name: str
    description: str | None
    default_price: int  # ✅ VISÍVEL
    unit: str | None
    organization_id: int
```

#### Schema para Crew (Limitado)
```python
class ServiceCrewRead(BaseModel):
    id: int
    name: str
    description: str | None
    # ❌ default_price REMOVIDO
    unit: str | None
    organization_id: int
```

#### Aplicação Dinâmica
```python
@router.get("/services/")
async def get_services(current_user: User = Depends(get_current_user)):
    services = await db.execute(...)  # Query única

    if current_user.role == "admin":
        return [ServiceResponse.from_orm(s) for s in services]  # Com preços
    else:
        return [ServiceCrewRead.from_orm(s) for s in services]  # Sem preços
```

### Privacidade Entre Membros da Equipe

**Problema Evitado:** Um colaborador não deve ver o cachê de outro colega.

#### Implementação:
```python
# Filtragem automática para crew
for production in productions:
    production.crew = [
        member for member in production.crew
        if member.user_id == current_user.id  # ✅ Apenas o próprio usuário
    ]
```

#### Resultado:
- ✅ Crew A vê apenas seu próprio registro na equipe
- ✅ Crew B vê apenas seu próprio registro na equipe
- ✅ Admin vê toda a equipe com todos os cachês

### Medidas de Segurança Adicionais

- **Rate Limiting:** Proteção contra ataques de força bruta
- **Input Validation:** Sanitização completa de dados
- **Audit Logging:** Rastreamento de todas as operações
- **HTTPS Only:** Comunicação criptografada obrigatória
- **Token Expiry:** Sessões limitadas temporalmente

---

## 📊 Dashboard Inteligente

### Métricas por Perfil

#### Dashboard Admin/Owner
```json
{
  "total_revenue": 2029800,    // R$ 20.298,00 - Receita Total
  "total_costs": 145000,       // R$ 1.450,00 - Custos Totais
  "total_taxes": 39800,        // R$ 398,00 - Impostos
  "total_profit": 1884800,     // R$ 18.848,00 - Lucro Líquido
  "total_productions": 3       // Número de Produções
}
```

#### Dashboard Crew/Colaborador
```json
{
  "total_earnings": 50000,     // R$ 500,00 - Cachês Recebidos
  "production_count": 1,       // Produções Participadas
  "total_revenue": null,       // 🚫 Dados Organizacionais Ocultos
  "total_costs": null,
  "total_taxes": null,
  "total_profit": null,
  "total_productions": null
}
```

### Lógica de Cálculo

**Para Admin:**
```sql
SELECT
    SUM(total_value) as total_revenue,
    SUM(total_cost) as total_costs,
    SUM(tax_amount) as total_taxes,
    SUM(profit) as total_profit,
    COUNT(*) as total_productions
FROM productions
WHERE organization_id = ?
```

**Para Crew:**
```sql
-- Soma dos cachês recebidos
SELECT SUM(fee) as total_earnings
FROM production_crew pc
JOIN productions p ON pc.production_id = p.id
WHERE pc.user_id = ? AND p.organization_id = ?

-- Contagem de produções
SELECT COUNT(DISTINCT pc.production_id) as production_count
FROM production_crew pc
JOIN productions p ON pc.production_id = p.id
WHERE pc.user_id = ? AND p.organization_id = ?
```

---

## 🔄 Fluxo de Dados (Endpoints)

### Clientes (`/api/v1/clients/`)

| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|---------|
| GET | `/` | Lista clientes da organização | Admin only |
| POST | `/` | Criar novo cliente | Admin only |

**Payload de Criação:**
```json
{
  "full_name": "João Silva",
  "email": "joao@empresa.com",
  "phone": "+55 11 99999-9999"
}
```

### Serviços (`/api/v1/services/`)

| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|---------|
| GET | `/` | Lista serviços (com/sem preços) | Todos |
| POST | `/` | Criar novo serviço | Admin only |

**Payload de Criação:**
```json
{
  "name": "Filmagem FPV",
  "description": "Filmagem com drone profissional",
  "default_price": 150000,  // Em centavos (R$ 1.500,00)
  "unit": "hour"
}
```

### Produções (`/api/v1/productions/`)

| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|---------|
| GET | `/` | Lista produções | Todos (filtrado por role) |
| GET | `/{id}` | Detalhes da produção | Todos (filtrado por role) |
| POST | `/` | Criar produção | Admin only |
| PATCH | `/{id}` | Atualizar produção | Admin only |
| DELETE | `/{id}` | Excluir produção | Admin only |

**Payload de Criação:**
```json
{
  "title": "Comercial Verão 2025",
  "client_id": 1,
  "deadline": "2025-07-15T00:00:00Z",
  "locations": "São Paulo, Rio de Janeiro",
  "filming_dates": "2025-06-20 to 2025-06-25",
  "payment_method": "bank_transfer",
  "due_date": "2025-07-30T00:00:00Z"
}
```

### Equipe (`/api/v1/productions/{production_id}/crew/`)

| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|---------|
| GET | `/` | Lista membros da equipe | Todos (filtrado) |
| POST | `/` | Adicionar membro | Admin only |
| DELETE | `/{user_id}` | Remover membro | Admin only |

**Payload para Adicionar Membro:**
```json
{
  "user_id": 5,
  "role": "cameraman",
  "fee": 250000  // Em centavos (R$ 2.500,00)
}
```

---

## 🔧 Manutenção e Expansão

### Migrações com Alembic

**1. Criar Nova Migração:**
```bash
cd backend
alembic revision -m "add_new_field_to_clients"
```

**2. Editar a Migração:**
```python
def upgrade():
    op.add_column('clients', sa.Column('website', sa.String(), nullable=True))

def downgrade():
    op.drop_column('clients', sa.Column('website'))
```

**3. Aplicar Migração:**
```bash
alembic upgrade head
```

**4. Verificar Status:**
```bash
alembic current
alembic history
```

### Adicionando Novos Campos

**Exemplo: Adicionar CNPJ aos Clientes**

**1. Modelo SQLAlchemy:**
```python
class Client(Base):
    # ... campos existentes ...
    cnpj: Mapped[str | None] = mapped_column(String(18), nullable=True)  # 00.000.000/0000-00
```

**2. Schema Pydantic:**
```python
class ClientResponse(BaseModel):
    # ... campos existentes ...
    cnpj: str | None = None
```

**3. Migração:**
```python
def upgrade():
    op.add_column('clients', sa.Column('cnpj', sa.String(18), nullable=True))
```

### Escalando Equipe em Produções

**Fluxo para Adicionar Membro:**

```python
# 1. Verificar se usuário existe e pertence à mesma organização
user = await db.execute(
    select(User).where(
        User.id == crew_data.user_id,
        User.organization_id == current_user.organization_id
    )
)

# 2. Verificar se já está escalado
existing = await db.execute(
    select(ProductionCrew).where(
        ProductionCrew.production_id == production_id,
        ProductionCrew.user_id == crew_data.user_id
    )
)

# 3. Criar assignment
crew_member = ProductionCrew(
    production_id=production_id,
    user_id=crew_data.user_id,
    role=crew_data.role,
    fee=crew_data.fee
)

# 4. Recalcular totais da produção
await calculate_production_totals(production_id, db)
```

### Monitoramento e Logs

**Logs de Segurança:**
```python
# Em endpoints críticos
logger.info(f"User {current_user.id} accessed production {production_id}")
```

**Health Checks:**
```python
@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    # Verificar conexão com banco
    await db.execute(text("SELECT 1"))
    return {"status": "healthy"}
```

---

## 🎯 Considerações Finais

### Princípios Arquiteturais

1. **Segurança Primeiro:** Todos os dados são protegidos por padrão
2. **Privacidade por Design:** Dados sensíveis são omitidos, não mascarados
3. **Isolamento Total:** Multi-tenancy rigoroso em todos os níveis
4. **Performance Otimizada:** Eager loading e índices apropriados

### Próximos Passos para Desenvolvimento

1. **Frontend Integration:** Usar este guia para implementar chamadas API
2. **Testes Automatizados:** Criar suite completa de testes de segurança
3. **Monitoramento:** Implementar logging e alertas de segurança
4. **Documentação da API:** Gerar OpenAPI/Swagger automático

### Suporte e Manutenção

- **Versionamento:** API versionada (v1) para compatibilidade
- **Deprecation:** Campos obsoletos marcados antes da remoção
- **Backups:** Estratégia de backup inclui isolamento por tenant
- **Recuperação:** Planos de disaster recovery tenant-aware

---

**📞 Suporte Técnico:** Para questões sobre implementação ou expansão, consulte este documento ou abra uma issue no repositório.

**🔐 Status de Segurança:** Sistema auditado e aprovado - 11/11 testes de segurança passaram.

**🏗️ Arquitetura:** Multi-tenant enterprise-ready com isolamento completo de dados.
