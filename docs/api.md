# 📚 API Reference - SafeTasks V2

Documentação completa das APIs REST do SafeTasks V2, construídas com FastAPI.

## 🏁 Visão Geral

- **Base URL**: `http://localhost:8000/api/v1`
- **Autenticação**: JWT Bearer Token
- **Formato**: JSON
- **Versionamento**: Path-based (`/v1/`)
- **Documentação Interativa**: [Swagger UI](http://localhost:8000/docs)

## 🔐 Autenticação

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

**Resposta de Sucesso:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "João Silva",
    "role": "admin"
  }
}
```

### Usar Token
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## 👥 Usuários

### Listar Usuários
```http
GET /api/v1/users/
Authorization: Bearer <token>
```

**Parâmetros de Query:**
- `skip` (int): Pular N registros (default: 0)
- `limit` (int): Limite de resultados (default: 50, max: 100)

**Resposta:**
```json
{
  "items": [
    {
      "id": 1,
      "email": "user@example.com",
      "full_name": "João Silva",
      "role": "admin",
      "organization_id": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 50,
  "has_more": false
}
```

### Obter Usuário Atual
```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

### Criar Usuário
```http
POST /api/v1/users/
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "full_name": "Novo Usuário",
  "password": "securepassword123",
  "role": "crew"
}
```

### Atualizar Usuário
```http
PUT /api/v1/users/{user_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "updated@example.com",
  "full_name": "Nome Atualizado",
  "role": "admin"
}
```

### Deletar Usuário
```http
DELETE /api/v1/users/{user_id}
Authorization: Bearer <token>
```

## 🎬 Produções

### Listar Produções
```http
GET /api/v1/productions/
Authorization: Bearer <token>
```

**Parâmetros de Query:**
- `skip` (int): Paginação (default: 0)
- `limit` (int): Limite (default: 50, max: 100)
- `status` (string): Filtrar por status
- `search` (string): Busca por título

**Resposta:**
```json
{
  "productionsList": [
    {
      "id": "prod-123",
      "title": "Filme Corporativo ABC",
      "description": "Produção institucional",
      "status": "completed",
      "deadline": "2024-12-31",
      "payment_method": "pix",
      "due_date": "2024-12-15",
      "tax_rate": 10.0,
      "total_value": 500000,  // centavos
      "subtotal": 454545,     // centavos
      "total_cost": 0,        // centavos
      "tax_amount": 45455,    // centavos
      "profit": 500000,       // centavos
      "client": {
        "id": 1,
        "full_name": "Cliente ABC Ltda"
      },
      "organization_id": 1,
      "created_by": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 50,
  "has_more": false
}
```

### Obter Produção Específica
```http
GET /api/v1/productions/{production_id}
Authorization: Bearer <token>
```

**Resposta:** Objeto completo de produção com arrays populados:
- `items[]`: Itens/serviços da produção
- `expenses[]`: Despesas associadas
- `crew[]`: Equipe alocada

### Criar Produção
```http
POST /api/v1/productions/
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Novo Filme Corporativo",
  "description": "Produção para empresa XYZ",
  "deadline": "2024-12-31",
  "client_id": 1,
  "shooting_sessions": [
    {
      "date": "2024-11-15",
      "location": "São Paulo, SP"
    }
  ],
  "payment_method": "pix",
  "due_date": "2024-12-15"
}
```

**Campos Opcionais:**
- `description`: Descrição detalhada
- `shooting_sessions`: Array de sessões de filmagem
- `payment_method`: "pix", "credit", "debit", "link", "crypto", "boleto"
- `due_date`: Data de vencimento do pagamento

### Atualizar Produção
```http
PUT /api/v1/productions/{production_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Título Atualizado",
  "status": "in_progress",
  "deadline": "2024-12-31"
}
```

### Deletar Produção
```http
DELETE /api/v1/productions/{production_id}
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "message": "Production deleted successfully"
}
```

## 📊 Dashboard

### Resumo do Dashboard
```http
GET /api/v1/dashboard/summary
Authorization: Bearer <token>
```

**Resposta para Admin:**
```json
{
  "total_revenue": 2500000,    // centavos
  "total_costs": 1800000,      // centavos
  "total_taxes": 200000,       // centavos
  "total_profit": 500000,      // centavos
  "total_productions": 16,
  "profit_margin": 20.0,       // porcentagem
  "completion_rate": 62.5,     // porcentagem
  "monthly_revenue": [
    {
      "month": "Jan",
      "revenue": 250000         // centavos
    }
  ],
  "productions_by_status": [
    {
      "status": "completed",
      "count": 10,
      "percentage": 62.5,
      "total_value": 1500000     // centavos
    }
  ],
  "top_clients": [
    {
      "name": "Cliente Premium A",
      "total_value": 885000,     // centavos
      "productions_count": 4
    }
  ]
}
```

**Resposta para Crew:**
```json
{
  "total_earnings": 150000,     // centavos (ganhos pessoais)
  "production_count": 3         // produções atribuídas
}
```

## 👥 Clientes

### Listar Clientes
```http
GET /api/v1/clients/
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "items": [
    {
      "id": 1,
      "full_name": "Cliente ABC Ltda",
      "email": "contato@clienteabc.com",
      "phone": "+55 11 99999-9999",
      "organization_id": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 50
}
```

### Criar Cliente
```http
POST /api/v1/clients/
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "Novo Cliente Ltda",
  "email": "contato@novocliente.com",
  "phone": "+55 11 88888-8888"
}
```

## 💰 Itens de Produção

### Adicionar Item à Produção
```http
POST /api/v1/productions/{production_id}/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "service_id": 1,
  "quantity": 2
}
```

### Listar Itens da Produção
```http
GET /api/v1/productions/{production_id}/items
Authorization: Bearer <token>
```

**Resposta:**
```json
[
  {
    "id": 1,
    "production_id": "prod-123",
    "service_id": 1,
    "service": {
      "id": 1,
      "name": "Filmagem 4K",
      "description": "Filmagem em resolução 4K",
      "price": 250000  // centavos
    },
    "quantity": 2,
    "total_price": 500000  // centavos (quantity * price)
  }
]
```

### Atualizar Item
```http
PUT /api/v1/productions/{production_id}/items/{item_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

### Remover Item
```http
DELETE /api/v1/productions/{production_id}/items/{item_id}
Authorization: Bearer <token>
```

## 👷 Equipe de Produção

### Adicionar Membro à Produção
```http
POST /api/v1/productions/{production_id}/crew
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 2,
  "role": "Cameraman",
  "fee": 150000  // centavos
}
```

### Listar Equipe da Produção
```http
GET /api/v1/productions/{production_id}/crew
Authorization: Bearer <token>
```

**Resposta:**
```json
[
  {
    "id": 1,
    "production_id": "prod-123",
    "user_id": 2,
    "user": {
      "id": 2,
      "email": "crew@example.com",
      "full_name": "João Cameraman"
    },
    "role": "Cameraman",
    "fee": 150000  // centavos
  }
]
```

### Atualizar Membro da Equipe
```http
PUT /api/v1/productions/{production_id}/crew/{crew_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "Diretor de Fotografia",
  "fee": 200000
}
```

### Remover Membro da Equipe
```http
DELETE /api/v1/productions/{production_id}/crew/{crew_id}
Authorization: Bearer <token>
```

## 💸 Despesas

### Adicionar Despesa à Produção
```http
POST /api/v1/productions/{production_id}/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Locação de Equipamento",
  "value": 50000,  // centavos
  "category": "equipamento"
}
```

### Listar Despesas da Produção
```http
GET /api/v1/productions/{production_id}/expenses
Authorization: Bearer <token>
```

### Atualizar Despesa
```http
PUT /api/v1/productions/{production_id}/expenses/{expense_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Locação de Equipamento Premium",
  "value": 75000,
  "category": "equipamento"
}
```

### Remover Despesa
```http
DELETE /api/v1/productions/{production_id}/expenses/{expense_id}
Authorization: Bearer <token>
```

## 🔧 Serviços

### Listar Serviços
```http
GET /api/v1/services/
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Filmagem 4K",
      "description": "Filmagem profissional em 4K",
      "price": 250000,  // centavos
      "organization_id": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

### Criar Serviço
```http
POST /api/v1/services/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Edição de Vídeo",
  "description": "Edição profissional com correção de cor",
  "price": 150000  // centavos
}
```

## 📋 Códigos de Status

### Produções
- `draft`: Rascunho
- `proposal_sent`: Proposta Enviada
- `approved`: Aprovada
- `in_progress`: Em Andamento
- `completed`: Concluída
- `canceled`: Cancelada

### HTTP Status Codes
- `200`: OK - Sucesso
- `201`: Created - Recurso criado
- `204`: No Content - Sucesso sem conteúdo
- `400`: Bad Request - Dados inválidos
- `401`: Unauthorized - Token inválido
- `403`: Forbidden - Permissão insuficiente
- `404`: Not Found - Recurso não encontrado
- `422`: Unprocessable Entity - Validação falhou
- `429`: Too Many Requests - Rate limit excedido
- `500`: Internal Server Error - Erro interno

## 🔒 Rate Limiting

- **Login**: 5 tentativas por minuto
- **Geral**: 200 requests por minuto
- **Escrita**: 30 requests por minuto

## 📏 Limites de Paginação

- **Máximo por página**: 100 registros
- **Padrão por página**: 50 registros
- **Máximo de skip**: 10.000 registros

## 💡 Dicas de Uso

### 1. Sempre use paginação
```javascript
// ❌ Errado
const allProductions = await api.get('/productions/');

// ✅ Correto
const productions = await api.get('/productions/?limit=50');
```

### 2. Use filtros para performance
```javascript
// Busca específica
const productions = await api.get('/productions/?search=filme&status=completed');
```

### 3. Manipule erros adequadamente
```javascript
try {
  const response = await api.post('/productions/', productionData);
  console.log('Produção criada:', response.data);
} catch (error) {
  if (error.response?.status === 422) {
    console.log('Dados inválidos:', error.response.data.detail);
  } else {
    console.log('Erro inesperado:', error.message);
  }
}
```

### 4. Use campos expandidos quando necessário
```javascript
// Para obter produção completa com todos os relacionamentos
const production = await api.get(`/productions/${id}`);
// Retorna: items[], expenses[], crew[] populados
```

---

## 🔗 Links Úteis

- [Documentação Interativa (Swagger)](http://localhost:8000/docs)
- [Documentação Alternativa (ReDoc)](http://localhost:8000/redoc)
- [Health Check](http://localhost:8000/health)
- [Frontend](http://localhost:3000)

---

*Esta documentação é mantida automaticamente atualizada com o código da API.*

