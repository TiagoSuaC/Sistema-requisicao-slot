# Arquitetura do Sistema
# Sistema de Gestão de Macro Períodos

**Versão**: 2.0.0
**Data**: Janeiro 2026
**Status**: Produção

---

## 1. Visão Geral

### 1.1 Diagrama de Alto Nível

```
┌─────────────────┐
│                 │
│    Frontend     │  Next.js 14 + TypeScript
│  (Port 3000)    │  React + Tailwind CSS
│                 │
└────────┬────────┘
         │ HTTP/REST
         │ JSON
         ▼
┌─────────────────┐
│                 │
│    Backend      │  FastAPI + Python 3.12
│  (Port 8000)    │  SQLAlchemy 2.0
│                 │
└────────┬────────┘
         │ SQL
         │ (asyncpg)
         ▼
┌─────────────────┐
│                 │
│   PostgreSQL    │  v16
│  (Port 5432)    │
│                 │
└─────────────────┘
```

### 1.2 Padrão Arquitetural

**Arquitetura em 3 Camadas** (Three-Tier Architecture):

1. **Presentation Layer** (Frontend)
2. **Application Layer** (Backend API)
3. **Data Layer** (PostgreSQL)

**Comunicação**:
- Frontend ↔ Backend: REST API (JSON sobre HTTP/HTTPS)
- Backend ↔ Database: SQL via SQLAlchemy ORM

---

## 2. Stack Tecnológico

### 2.1 Backend

| Componente | Tecnologia | Versão | Justificativa |
|------------|------------|--------|---------------|
| **Runtime** | Python | 3.12+ | Performance, type hints, async/await |
| **Framework** | FastAPI | 0.109+ | Alta performance, async nativo, OpenAPI automático |
| **ORM** | SQLAlchemy | 2.0+ | ORM maduro, suporte async, migrations |
| **Database** | PostgreSQL | 16+ | ACID, confiabilidade, JSON support |
| **Migrations** | Alembic | 1.13+ | Versionamento de schema |
| **Auth** | JWT | PyJWT | Stateless, escalável |
| **Calendar** | iCalendar | 6.0+ | Geração de arquivos .ics |
| **CORS** | fastapi.middleware | - | Acesso cross-origin |
| **Validation** | Pydantic | 2.0+ | Type safety, validação automática |

### 2.2 Frontend

| Componente | Tecnologia | Versão | Justificativa |
|------------|------------|--------|---------------|
| **Framework** | Next.js | 14.1+ | SSR, File-based routing, performance |
| **Language** | TypeScript | 5.0+ | Type safety, melhor DX |
| **UI** | React | 18+ | Component-based, ecosystem maduro |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first, responsivo, DX |
| **Calendar** | react-day-picker | 8.10+ | Flexível, acessível, customizável |
| **HTTP Client** | axios | 1.6+ | Interceptors, error handling |
| **State** | React Hooks | - | useState, useEffect (sem Redux) |

### 2.3 Infraestrutura

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| **Containerização** | Docker | Isolamento, reprodutibilidade |
| **Orquestração Local** | Docker Compose | Fácil setup multi-container |
| **Proxy Reverso** | Nginx | (Produção) Load balancing, SSL termination |
| **CI/CD** | GitHub Actions | (Futuro) Integração nativa GitHub |

---

## 3. Estrutura de Diretórios

### 3.1 Backend

```
backend/
├── alembic/                 # Migrations do banco
│   ├── versions/           # Scripts de migration
│   └── env.py
├── app/
│   ├── __init__.py
│   ├── main.py             # Entry point FastAPI
│   ├── config.py           # Configurações (env vars)
│   ├── database.py         # Setup SQLAlchemy
│   ├── auth.py             # JWT authentication
│   ├── utils.py            # Helpers diversos
│   ├── api/                # Endpoints
│   │   ├── __init__.py
│   │   ├── auth.py         # /auth/login
│   │   ├── units.py        # /units
│   │   ├── doctors.py      # /doctors
│   │   ├── macro_periods.py # /macro-periods
│   │   └── public.py       # /public (sem auth)
│   ├── models/             # SQLAlchemy Models
│   │   ├── __init__.py
│   │   ├── unit.py
│   │   ├── doctor.py
│   │   ├── macro_period.py
│   │   ├── macro_period_unit.py
│   │   ├── selection.py
│   │   └── audit.py
│   └── schemas/            # Pydantic Schemas
│       ├── __init__.py
│       ├── unit.py
│       ├── doctor.py
│       ├── macro_period.py
│       ├── macro_period_unit.py
│       └── selection.py
├── seed_data.py            # Script de seed
├── Dockerfile
└── requirements.txt
```

### 3.2 Frontend

```
frontend/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── layout.tsx      # Layout global
│   │   ├── page.tsx        # / (login)
│   │   ├── admin/          # Painel admin
│   │   │   └── macro-periods/
│   │   │       ├── page.tsx       # Lista
│   │   │       ├── new/page.tsx   # Criar
│   │   │       └── [id]/page.tsx  # Detalhes
│   │   └── p/              # Páginas públicas
│   │       └── [token]/page.tsx   # Resposta do médico
│   ├── lib/
│   │   ├── api.ts          # Cliente HTTP (axios)
│   │   └── types.ts        # TypeScript types
│   └── styles/
│       └── globals.css     # Tailwind imports
├── public/                 # Assets estáticos
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── Dockerfile
```

---

## 4. Modelo de Dados

### 4.1 Diagrama ER

```
┌─────────────┐           ┌──────────────────┐
│   units     │           │  macro_periods   │
├─────────────┤           ├──────────────────┤
│ id  (PK)    │           │ id (PK)          │
│ name        │           │ doctor_id (FK)   │
│ city        │◄──────────│ start_date       │
│ config_turnos│          │ end_date         │
└─────────────┘           │ status           │
                          │ public_token     │
                          │ created_at       │
                          │ responded_at     │
                          └──────┬───────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
┌──────────────────────┐  ┌──────────────────┐  ┌─────────────┐
│ macro_period_units   │  │   selections     │  │   audits    │
├──────────────────────┤  ├──────────────────┤  ├─────────────┤
│ id (PK)              │  │ id (PK)          │  │ id (PK)     │
│ macro_period_id (FK) │  │ mp_id (FK)       │  │ mp_id (FK)  │
│ unit_id (FK)         │  │ mp_unit_id (FK)  │  │ event_type  │
│ total_days           │  │ date             │  │ payload     │
│ order_position       │  │ part_of_day      │  │ created_at  │
└──────────────────────┘  │ custom_start     │  │ created_by  │
                          │ custom_end       │  └─────────────┘
                          │ block_id         │
                          └──────────────────┘

┌──────────────┐
│   doctors    │
├──────────────┤
│ id (PK)      │
│ name         │
│ email        │
│ active       │
└──────────────┘
```

### 4.2 Descrição das Tabelas

#### `units` (Unidades)
- **Propósito**: Armazena locais físicos (hospitais, clínicas)
- **Campos principais**: name, city, config_turnos (JSON com horários padrão)
- **Índices**: name, city

#### `doctors` (Médicos)
- **Propósito**: Cadastro de profissionais
- **Campos principais**: name, email, active
- **Índices**: email (unique)

#### `macro_periods` (Macro Períodos)
- **Propósito**: Períodos para coleta de disponibilidade
- **Campos principais**: doctor_id, start_date, end_date, status, public_token
- **Status**: AGUARDANDO, RESPONDIDO, EDICAO_LIBERADA, CONFIRMADO, CANCELADO, EXPIRADO
- **Índices**: public_token (unique), doctor_id, status, created_at

#### `macro_period_units` (Unidades do Macro Período)
- **Propósito**: Relação N:N entre macro_periods e units
- **Campos principais**: macro_period_id, unit_id, total_days, order_position
- **Regra**: Um macro período pode ter múltiplas unidades

#### `macro_period_selections` (Seleções do Médico)
- **Propósito**: Dias/horários selecionados
- **Campos principais**: date, part_of_day (FULL_DAY|MORNING|AFTERNOON|CUSTOM), custom_start, custom_end, block_id
- **Índices**: macro_period_id, date

#### `audit_events` (Histórico)
- **Propósito**: Audit trail imutável
- **Campos principais**: event_type, payload (JSON), created_at, created_by
- **Eventos**: CREATED, LINK_VIEWED, RESPONDED, UPDATED, UNLOCKED, CONFIRMED, CANCELLED, DRAFT_SAVED

---

## 5. Padrões e Convenções

### 5.1 Backend

**Padrão de Código**:
- PEP 8 (Python style guide)
- Type hints em todas as funções
- Docstrings em funções públicas
- snake_case para variáveis e funções
- PascalCase para classes

**Estrutura de Endpoint**:
```python
@router.get("/resource/{id}")
async def get_resource(
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> ResourceResponse:
    """
    Descrição do endpoint.

    Args:
        id: ID do recurso
        db: Sessão do banco
        current_user: Usuário autenticado

    Returns:
        ResourceResponse com dados

    Raises:
        HTTPException: 404 se não encontrado
    """
    pass
```

**Tratamento de Erros**:
```python
# Usar HTTPException com status codes apropriados
raise HTTPException(
    status_code=404,
    detail="Resource not found"
)
```

### 5.2 Frontend

**Padrão de Código**:
- ESLint + Prettier
- camelCase para variáveis e funções
- PascalCase para componentes React
- Functional components com hooks (sem classes)

**Estrutura de Componente**:
```typescript
"use client"; // Se precisar de interatividade

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ComponentProps {
  prop1: string;
  prop2: number;
}

export default function Component({ prop1, prop2 }: ComponentProps) {
  const [state, setState] = useState<Type>(initial);
  const router = useRouter();

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  const handleAction = () => {
    // Event handler
  };

  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
}
```

**Gerenciamento de Estado**:
- useState para estado local
- Props para passar dados entre componentes
- Context API apenas se necessário (evitar prop drilling)
- Sem Redux/Zustand (simplicidade para MVP)

---

## 6. Fluxo de Dados

### 6.1 Criação de Macro Período

```
Admin (Frontend)
  │
  │ 1. Preenche formulário
  │
  ▼
POST /macro-periods
  │
  │ 2. Backend valida
  │ 3. Cria registro no banco
  │ 4. Gera token seguro
  │ 5. Cria audit event
  │
  ▼
200 OK + { id, token, ... }
  │
  │ 6. Frontend exibe link
  │ 7. Copia para clipboard
  │
  ▼
Admin compartilha link
```

### 6.2 Resposta do Médico

```
Médico abre link
  │
  │ 1. GET /public/macro-period/{token}
  │
  ▼
Backend retorna dados
  │
  │ 2. Médico seleciona dias
  │ 3. Configura períodos
  │ 4. Valida conflitos (frontend)
  │
  ▼
POST /public/macro-period/{token}/response
  │
  │ 5. Backend valida novamente
  │ 6. Verifica conflitos
  │ 7. Salva seleções
  │ 8. Atualiza status
  │ 9. Cria audit event
  │
  ▼
200 OK
```

---

## 7. Segurança

### 7.1 Camadas de Proteção

1. **Rede**: HTTPS em produção (via Nginx/Load Balancer)
2. **Aplicação**: JWT para admin, Token forte para público
3. **Dados**: Validação em backend (never trust frontend)
4. **Infraestrutura**: Docker isolation, env vars para secrets

### 7.2 Autenticação

**Admin**:
```
1. POST /auth/login { email, password }
2. Backend valida credenciais
3. Gera JWT (exp: 24h)
4. Frontend armazena em memória (não localStorage!)
5. Envia em header: Authorization: Bearer {token}
```

**Médico** (Link público):
```
1. Token de 256 bits na URL
2. Sem autenticação adicional (link é a chave)
3. Token não expira (policy de negócio)
```

### 7.3 Validações

**Backend** (obrigatório):
- Validação de schema (Pydantic)
- Validação de ranges de data
- Validação de status transitions
- Validação de conflitos de horário
- SQL injection protection (ORM)

**Frontend** (UX):
- Validação de formulários
- Feedback visual imediato
- Prevenção de conflitos antes de enviar

---

## 8. Performance

### 8.1 Backend

- **Async/await**: Endpoints async para I/O não-bloqueante
- **Connection pooling**: SQLAlchemy pool (min 5, max 20)
- **Índices**: Criados em campos de busca/join
- **Eager loading**: `.options(joinedload())` para evitar N+1

### 8.2 Frontend

- **Code splitting**: Next.js automático
- **Image optimization**: next/image
- **CSS**: Tailwind com purge (apenas classes usadas)
- **Caching**: HTTP cache headers (stale-while-revalidate)

### 8.3 Database

- **Índices**: public_token, doctor_id, status, date
- **Particionamento**: (Futuro) Por data se volume crescer
- **Vacuum**: Automático do PostgreSQL

---

## 9. Observabilidade

### 9.1 Logs

**Backend**:
```python
import logging

logger = logging.getLogger(__name__)
logger.info(f"Macro period {id} created by {user}")
logger.error(f"Failed to process: {error}", exc_info=True)
```

**Formato**: JSON estruturado (futuro: ELK stack)

### 9.2 Métricas

- Tempo de resposta por endpoint
- Taxa de erro (4xx, 5xx)
- Uso de recursos (CPU, memória, conexões DB)

### 9.3 Alertas

- Uptime < 99.5% (1 hora)
- Taxa de erro > 1% (5 min)
- Latência p95 > 500ms (5 min)
- Disco > 80% (imediato)

---

## 10. Decisões Arquiteturais (ADRs)

### ADR-001: Monolito vs Microserviços
**Decisão**: Monolito (Backend único)
**Rationale**: MVP com equipe pequena, baixa complexidade, facilita deploy
**Trade-off**: Menos escalabilidade granular, mas suficiente para cenário atual

### ADR-002: Next.js SSR vs SPA
**Decisão**: Next.js com App Router
**Rationale**: SEO não crítico, mas SSR melhora performance inicial
**Trade-off**: Ligeiramente mais complexo que SPA pura

### ADR-003: REST vs GraphQL
**Decisão**: REST
**Rationale**: Simplicidade, endpoints bem definidos, sem over-fetching significativo
**Trade-off**: Menos flexibilidade para frontend, mas mais fácil de debugar

### ADR-004: PostgreSQL vs MongoDB
**Decisão**: PostgreSQL
**Rationale**: Dados relacionais, transações ACID, JSON support nativo
**Trade-off**: Menos flexível em schema, mas garante integridade

### ADR-005: JWT vs Session
**Decisão**: JWT para admin
**Rationale**: Stateless, escalável horizontalmente
**Trade-off**: Não pode invalidar tokens antes do expiry (mitigado com TTL curto)

---

## 11. Roadmap Técnico

### Q1 2026
- [ ] Testes automatizados (pytest + Jest)
- [ ] CI/CD com GitHub Actions
- [ ] Monitoramento (Prometheus + Grafana)

### Q2 2026
- [ ] Cache Redis para sessões
- [ ] Fila de jobs (Celery) para emails
- [ ] Kubernetes deployment

### Q3-Q4 2026
- [ ] Microserviços (se necessário)
- [ ] Event sourcing para audit
- [ ] Read replicas PostgreSQL

---

**Última Atualização**: Janeiro 2026
**Autor**: Equipe de Desenvolvimento
**Revisão**: Trimestral
