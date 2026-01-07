# 🎬 SafeTasks V2

> **Sistema de Gestão de Produções Audiovisuais**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

SafeTasks V2 é uma plataforma SaaS completa para gestão de produções audiovisuais, desenvolvida com tecnologias modernas e arquitetura enterprise-ready.

## 📋 Visão Geral

### 🎯 Objetivo
Fornecer uma solução completa e intuitiva para produtoras audiovisuais gerenciarem todo o ciclo de vida de suas produções, desde o planejamento até a entrega final.

### ✨ Funcionalidades Principais

#### 📊 Dashboard Executivo
- **KPIs em Tempo Real**: Receita, custos, lucro, margem e taxa de conclusão
- **Gráficos Interativos**: Evolução da receita, status das produções e top clientes
- **Relatórios**: Geração de PDFs com dados financeiros e operacionais

#### 🎬 Gestão de Produções
- **CRUD Completo**: Criar, editar, visualizar e excluir produções
- **Organização por Status**: Rascunho → Proposta → Aprovada → Em Andamento → Concluída
- **Calendário Integrado**: Visualização de datas importantes e sessões de filmagem

#### 👥 Gestão de Equipe e Clientes
- **Controle de Usuários**: Múltiplas funções (Admin, Crew) com permissões adequadas
- **Base de Clientes**: Histórico completo e análise de receita por cliente
- **Atribuição de Equipe**: Controle de membros da equipe por produção

#### 💰 Gestão Financeira
- **Cálculos Automáticos**: Subtotal, impostos, custos totais e lucro
- **Serviços e Itens**: Precificação detalhada por serviço
- **Relatórios Fiscais**: Controle de impostos e margens

## 🏗️ Arquitetura Técnica

### Backend (FastAPI)
```
backend/
├── app/
│   ├── api/v1/endpoints/    # Endpoints REST
│   ├── core/               # Configurações e utilitários
│   │   ├── cache.py        # Redis cache
│   │   ├── config.py       # Configurações
│   │   └── logging_config.py
│   ├── models/            # SQLAlchemy models
│   ├── schemas/           # Pydantic schemas
│   └── services/          # Lógica de negócio
├── tests/                 # Testes unitários
└── alembic/              # Migrations
```

### Frontend (Next.js)
```
frontend/
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── dashboard/     # Páginas principais
│   │   └── api/          # API routes (se necessário)
│   ├── components/       # Componentes reutilizáveis
│   │   ├── ui/           # Componentes base (shadcn/ui)
│   │   └── dashboard/    # Componentes específicos
│   └── lib/              # Utilitários e configurações
├── public/               # Assets estáticos
└── docs/                # Documentação adicional
```

### 🗄️ Banco de Dados
- **PostgreSQL**: Dados relacionais principais
- **Redis**: Cache de alta performance
- **Alembic**: Controle de migrations

## 🚀 Tecnologias Utilizadas

### Backend
- **FastAPI**: Framework web assíncrono e moderno
- **SQLAlchemy**: ORM para PostgreSQL
- **Pydantic**: Validação de dados e schemas
- **Redis**: Cache distribuído
- **Alembic**: Migrations de banco
- **SlowAPI**: Rate limiting

### Frontend
- **Next.js 15**: React framework com App Router
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Styling utilitário
- **shadcn/ui**: Componentes base
- **Recharts**: Gráficos interativos
- **React Hook Form**: Gerenciamento de formulários

### DevOps & Qualidade
- **Poetry**: Gerenciamento de dependências Python
- **ESLint/Prettier**: Code quality
- **Playwright**: Testes E2E (planejado)
- **Docker**: Containerização (planejado)

## 🛠️ Instalação e Setup

### Pré-requisitos
- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 15+**
- **Redis** (opcional, para cache)
- **Poetry** (gerenciador de dependências Python)

### 1. Clone o Repositório
```bash
git clone https://github.com/your-org/safetasks-v2.git
cd safetasks-v2
```

### 2. Backend Setup

#### Instalar Dependências
```bash
cd backend
poetry install
```

#### Configurar Banco de Dados
```bash
# Criar banco PostgreSQL
createdb safetasks_dev

# Executar migrations
poetry run alembic upgrade head
```

#### Configurar Variáveis de Ambiente
```bash
# Copiar e editar .env
cp .env.example .env

# Editar DATABASE_URL e outras configurações
nano .env
```

#### Iniciar Backend
```bash
# Desenvolvimento
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Produção
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**APIs disponíveis:**
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

### 3. Frontend Setup

#### Instalar Dependências
```bash
cd frontend
npm install
```

#### Configurar Variáveis de Ambiente
```bash
# Copiar e editar .env.local
cp .env.example .env.local

# Configurar API_URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

#### Iniciar Frontend
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build && npm start
```

**Aplicação disponível em:** http://localhost:3000

## 📖 Uso

### Primeiro Acesso
1. **Backend deve estar rodando** (porta 8000)
2. **Acesse** http://localhost:3000
3. **Faça login** com credenciais padrão ou crie nova conta
4. **Explore o dashboard** e funcionalidades

### Funcionalidades Principais

#### Criando uma Produção
1. Acesse **Dashboard → Produções**
2. Clique **"Nova Produção"**
3. Preencha dados básicos (título, cliente, prazo)
4. Configure serviços e equipe
5. Monitore progresso no dashboard

#### Gerenciando Equipe
1. Acesse **Dashboard → Equipe**
2. Adicione novos membros
3. Atribua funções por produção
4. Controle custos por membro

#### Visualizando Relatórios
1. Acesse **Dashboard → Relatórios**
2. Gere relatórios financeiros
3. Exporte dados em PDF
4. Analise tendências

## 🔧 Scripts Disponíveis

### Backend
```bash
# Executar testes
poetry run pytest

# Formatar código
poetry run black .
poetry run isort .

# Verificar tipos
poetry run mypy

# Executar migrations
poetry run alembic upgrade head
poetry run alembic revision --autogenerate -m "Descrição"
```

### Frontend
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Verificar build
npm run lint
npm run type-check

# Testes (quando implementados)
npm run test
npm run test:e2e
```

## 📁 Estrutura do Projeto

```
safetasks-v2/
├── backend/               # API FastAPI
│   ├── app/
│   ├── tests/
│   ├── alembic/
│   └── pyproject.toml
├── frontend/             # Aplicação Next.js
│   ├── src/
│   ├── public/
│   └── package.json
├── docs/                 # Documentação (planejado)
├── docker/               # Docker configs (planejado)
├── .github/             # CI/CD (planejado)
├── README.md            # Este arquivo
└── CONTRIBUTING.md      # Como contribuir
```

## 🤝 Como Contribuir

### Processo de Contribuição
1. **Fork** o projeto
2. **Clone** seu fork: `git clone https://github.com/YOUR-USERNAME/safetasks-v2.git`
3. **Crie uma branch** para sua feature: `git checkout -b feature/nome-da-feature`
4. **Faça suas mudanças** seguindo os padrões de código
5. **Execute os testes**: `npm run test` e `poetry run pytest`
6. **Commit suas mudanças**: `git commit -m "feat: descrição da feature"`
7. **Push para seu fork**: `git push origin feature/nome-da-feature`
8. **Abra um Pull Request**

### Padrões de Código
- **Backend**: Black + isort + mypy
- **Frontend**: ESLint + Prettier + TypeScript
- **Commits**: [Conventional Commits](https://conventionalcommits.org/)
- **Branches**: `feature/`, `fix/`, `docs/`, `refactor/`

### Issues e Pull Requests
- Use templates disponíveis
- Descreva claramente o problema/solução
- Inclua screenshots para mudanças visuais
- Referencie issues relacionadas

## 📚 Documentação Adicional

- **[Arquitetura Técnica](docs/architecture.md)** - Decisões técnicas e padrões
- **[API Reference](docs/api.md)** - Documentação completa das APIs
- **[Deployment Guide](docs/deployment.md)** - Como fazer deploy
- **[Troubleshooting](docs/troubleshooting.md)** - Problemas comuns e soluções

## 🐛 Reportando Bugs

1. **Verifique** se o bug já foi reportado
2. **Use o template** de bug report
3. **Inclua**:
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots/logs
   - Ambiente (OS, browser, versões)

## 📈 Roadmap

### ✅ Concluído
- [x] **Sprint 1**: Segurança e estabilidade
- [x] **Sprint 2**: Performance e UX
- [x] **Sprint 3**: Escalabilidade
- [x] **Sprint 4**: Qualidade e documentação (em andamento)

### 🚧 Em Desenvolvimento
- [ ] Documentação completa de APIs
- [ ] Testes E2E com Playwright
- [ ] Melhorias de acessibilidade
- [ ] Design system padronizado

### 🔮 Planejado
- [ ] PWA (Progressive Web App)
- [ ] Multi-tenancy para organizações
- [ ] Integração com ferramentas externas
- [ ] Analytics avançado

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

- **Tech Lead & Fullstack Developer**: Nicolas Bertoni
- **Arquitetura**: FastAPI + Next.js stack
- **Design**: Liquid Glass aesthetic

## 🙏 Agradecimentos

- **FastAPI** por tornar APIs Python uma alegria
- **Next.js** por revolucionar React development
- **shadcn/ui** por componentes acessíveis e bonitos
- **Comunidade Open Source** por ferramentas incríveis

---

## 📞 Suporte

**Precisa de ajuda?**

- 📧 **Email**: suporte@safetasks.com
- 💬 **Issues**: [GitHub Issues](https://github.com/your-org/safetasks-v2/issues)
- 📖 **Documentação**: [Docs](docs/)
- 🐛 **Bug Reports**: Use templates no GitHub

---

**🎬 SafeTasks V2 - Transformando a gestão de produções audiovisuais**

