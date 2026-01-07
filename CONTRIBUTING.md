# 🤝 Guia de Contribuição - SafeTasks V2

Bem-vindo! 🎉 Estamos felizes que você queira contribuir com o SafeTasks V2. Este documento explica como você pode ajudar a melhorar nossa plataforma de gestão de produções audiovisuais.

## 📋 Índice

- [Código de Conduta](#codigo-de-conduta)
- [Como Começar](#como-comecar)
- [Configuração do Ambiente](#configuracao-do-ambiente)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Padrões de Desenvolvimento](#padrões-de-desenvolvimento)
- [Fluxo de Trabalho](#fluxo-de-trabalho)
- [Testes](#testes)
- [Documentação](#documentacao)
- [Issues e Pull Requests](#issues-e-pull-requests)

## 🛡️ Código de Conduta

Este projeto segue um código de conduta profissional. Seja respeitoso, inclusivo e colaborativo. Discriminação, assédio ou comportamento inadequado não serão tolerados.

**Princípios:**
- 🙌 **Respeito mútuo**
- 🤝 **Colaboração ativa**
- 🎯 **Foco na qualidade**
- 📚 **Compartilhamento de conhecimento**

## 🚀 Como Começar

### Pré-requisitos
- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 15+**
- **Redis** (opcional)
- **Poetry** e **npm**

### Primeiro Passo
1. **Fork** o projeto no GitHub
2. **Clone** seu fork: `git clone https://github.com/YOUR-USERNAME/safetasks-v2.git`
3. **Siga o setup** no [README.md](README.md)

## 🛠️ Configuração do Ambiente

### Backend (Python/FastAPI)
```bash
cd backend

# Instalar dependências
poetry install

# Configurar banco
createdb safetasks_dev
poetry run alembic upgrade head

# Configurar .env
cp .env.example .env
# Edite DATABASE_URL e outras variáveis

# Iniciar desenvolvimento
poetry run uvicorn app.main:app --reload
```

### Frontend (Next.js)
```bash
cd frontend

# Instalar dependências
npm install

# Configurar .env
cp .env.example .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Iniciar desenvolvimento
npm run dev
```

### Verificação
- **Backend**: http://localhost:8000/docs (Swagger)
- **Frontend**: http://localhost:3000
- **Banco**: Verificar tabelas criadas

## 📁 Estrutura do Projeto

```
safetasks-v2/
├── backend/               # 🐍 API FastAPI
│   ├── app/
│   │   ├── api/v1/endpoints/  # Endpoints REST
│   │   ├── core/              # Configurações centrais
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   └── services/          # Lógica de negócio
│   ├── tests/                 # 🧪 Testes
│   └── alembic/              # 🗄️ Migrations
├── frontend/             # ⚛️ Next.js App
│   ├── src/
│   │   ├── app/               # App Router
│   │   ├── components/        # Componentes React
│   │   └── lib/              # Utilitários
│   └── public/               # Assets
├── docs/                 # 📚 Documentação
└── docker/               # 🐳 Containerização
```

## 💻 Padrões de Desenvolvimento

### Backend (Python)

#### Estilo de Código
```bash
# Formatação automática
poetry run black .
poetry run isort .

# Verificação de tipos
poetry run mypy

# Linting
poetry run flake8
```

#### Padrões
- **Black**: Formatação de código (linha de 88 chars)
- **isort**: Ordenação de imports
- **mypy**: Type checking rigoroso
- **Conventional Commits**: Padrão de mensagens

#### Estrutura de Arquivos
```python
# app/api/v1/endpoints/productions.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.production import ProductionCreate, ProductionResponse
from app.services.production_service import calculate_production_totals

router = APIRouter()

@router.post("/", response_model=ProductionResponse)
async def create_production(
    production: ProductionCreate,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
) -> ProductionResponse:
    """Create a new production."""
    # Implementation
```

### Frontend (TypeScript/React)

#### Estilo de Código
```bash
# Formatação
npm run format

# Linting
npm run lint

# Type checking
npm run type-check
```

#### Padrões
- **TypeScript**: Tipagem rigorosa (strict mode)
- **ESLint + Prettier**: Code quality
- **Component naming**: PascalCase
- **Hooks**: camelCase (useEffect, useState)
- **File naming**: kebab-case para arquivos

#### Estrutura de Componentes
```typescript
// components/dashboard/ProductionCard.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

interface ProductionCardProps {
  production: Production;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProductionCard({ production, onEdit, onDelete }: ProductionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(production.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold">{production.title}</h3>
      {/* Rest of component */}
    </Card>
  );
}
```

## 🔄 Fluxo de Trabalho

### 1. Criar Issue
- Use templates disponíveis
- Descreva claramente o problema/solução
- Adicione labels apropriadas

### 2. Criar Branch
```bash
# Para features
git checkout -b feature/nome-da-feature

# Para correções
git checkout -b fix/nome-do-bug

# Para documentação
git checkout -b docs/melhoria-documentacao

# Para refatoração
git checkout -b refactor/melhorar-performance
```

### 3. Desenvolvimento
- Faça commits pequenos e descritivos
- Mantenha branches atualizadas: `git rebase main`
- Execute testes frequentemente

### 4. Pull Request
```bash
# Antes de enviar PR
npm run lint && npm run type-check  # Frontend
poetry run black . && poetry run mypy  # Backend

# Criar PR com:
- Título descritivo
- Descrição detalhada
- Screenshots (se UI)
- Referência à issue
- Checklist completo
```

### 5. Code Review
- Aguarde revisão
- Responda comentários
- Faça ajustes necessários
- Aguarde aprovação

## 🧪 Testes

### Backend (Pytest)
```bash
# Executar todos os testes
poetry run pytest

# Com cobertura
poetry run pytest --cov=app --cov-report=html

# Testes específicos
poetry run pytest tests/test_production_service.py

# Debug mode
poetry run pytest -v -s
```

### Frontend (Jest + Testing Library)
```bash
# Executar testes
npm run test

# Com watch mode
npm run test:watch

# Com coverage
npm run test:coverage
```

### E2E (Playwright - Planejado)
```bash
# Executar testes E2E
npm run test:e2e

# Com UI mode
npm run test:e2e:ui
```

## 📚 Documentação

### Atualizar Documentação
- **README.md**: Visão geral e setup
- **API Docs**: Manter Swagger atualizado
- **Arquitetura**: Documentar mudanças significativas
- **Changelogs**: Registrar mudanças por versão

### Padrões de Documentação
```typescript
/**
 * Calculate production totals including costs and profits
 *
 * @param production_id - The production ID to calculate
 * @param db - Database session
 * @returns Promise<void>
 *
 * @example
 * await calculate_production_totals("prod-123", db);
 *
 * @throws {ValueError} When production not found
 */
export async function calculate_production_totals(
  production_id: string,
  db: AsyncSession
): Promise<void> {
  // Implementation
}
```

## 📝 Issues e Pull Requests

### Templates
- **Bug Report**: Passos para reproduzir, ambiente, expected vs actual
- **Feature Request**: Descrição, casos de uso, mockups
- **Documentation**: Melhorias na documentação

### Labels
- `bug`: Correção de bug
- `enhancement`: Nova funcionalidade
- `documentation`: Melhorias na docs
- `refactor`: Refatoração de código
- `testing`: Melhorias nos testes
- `performance`: Otimizações
- `accessibility`: Melhorias de A11y

### Pull Request Checklist
- [ ] **Testes passando**: `npm test` e `poetry run pytest`
- [ ] **Linting OK**: `npm run lint` e `poetry run black`
- [ ] **Tipos OK**: `npm run type-check` e `poetry run mypy`
- [ ] **Documentação atualizada**
- [ ] **Breaking changes documentados**
- [ ] **Screenshots para mudanças visuais**
- [ ] **Testes E2E atualizados** (se aplicável)

## 🎯 Áreas de Contribuição

### Iniciantes
- 📝 **Documentação**: Melhorar README, criar guias
- 🧪 **Testes**: Escrever testes unitários
- 🐛 **Bug fixes**: Correções simples
- 🎨 **UI/UX**: Melhorias visuais pequenas

### Intermediários
- ⚡ **Performance**: Otimizações
- 🔧 **Features**: Novas funcionalidades
- 🏗️ **Refatoração**: Melhorar código existente
- 📊 **Analytics**: Métricas e dashboards

### Avançados
- 🏛️ **Arquitetura**: Mudanças estruturais
- 🔒 **Segurança**: Melhorias de segurança
- 🚀 **DevOps**: CI/CD, deployment
- 📈 **Escalabilidade**: Otimizações para alta carga

## 🙏 Reconhecimento

Contribuições são reconhecidas através de:
- ✅ **Mencão no changelog**
- 🏆 **Créditos no README**
- 🌟 **Badges de contribuidores**
- 📧 **Agradecimentos públicos**

## 📞 Precisa de Ajuda?

- 📧 **Email**: dev@safetasks.com
- 💬 **Discord**: [SafeTasks Community](https://discord.gg/safetasks)
- 📖 **Docs**: [Documentação Completa](docs/)
- 🐛 **Issues**: Use para questões técnicas

---

**Obrigado por contribuir com o SafeTasks V2! 🎬✨**

Sua contribuição ajuda produtoras audiovisuais em todo o mundo a gerenciarem melhor seus projetos.

