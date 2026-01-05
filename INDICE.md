# 📚 Índice da Documentação

## 🚀 Por Onde Começar?

### Se você é novo no projeto:
1. **[RESUMO_ENTREGA.md](RESUMO_ENTREGA.md)** - Visão geral executiva
2. **[README.md](README.md)** - Documentação completa
3. **[FLUXO_VISUAL.md](FLUXO_VISUAL.md)** - Diagramas e fluxos

### Se vai instalar:
1. **[INSTALL_DOCKER.md](INSTALL_DOCKER.md)** - Instalação do Docker
2. **[README.md](README.md#-instalação-e-execução)** - Passos de instalação
3. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Problemas comuns

### Se vai validar:
1. **[VALIDACAO.md](VALIDACAO.md)** - Checklist completo (120+ itens)
2. **[README.md](README.md#-teste-mental)** - Critérios de aceitação

## 📄 Documentos Disponíveis

### 📘 Documentação Principal

#### **[README.md](README.md)** (10.000+ palavras)
Documentação técnica completa do sistema.

**Conteúdo**:
- ✅ Características do sistema
- ✅ Arquitetura e stack
- ✅ Requisitos e instalação
- ✅ Fluxo de uso (admin + médico)
- ✅ Status e transições
- ✅ Regras de negócio
- ✅ Modelo de dados
- ✅ Endpoints da API
- ✅ Comandos úteis
- ✅ Dados seed
- ✅ Decisões de design
- ✅ Limitações do MVP
- ✅ Segurança

**Use para**: Referência técnica completa

---

#### **[RESUMO_ENTREGA.md](RESUMO_ENTREGA.md)** (5.000+ palavras)
Resumo executivo da entrega do MVP.

**Conteúdo**:
- ✅ O que foi entregue (checklist visual)
- ✅ Funcionalidades implementadas
- ✅ Stack técnica
- ✅ Estrutura do projeto
- ✅ Como executar (quick start)
- ✅ Teste rápido
- ✅ Dados seed
- ✅ Decisões de design
- ✅ Requisitos atendidos
- ✅ Métricas de entrega
- ✅ Próximos passos

**Use para**: Apresentação para stakeholders

---

#### **[FLUXO_VISUAL.md](FLUXO_VISUAL.md)** (3.000+ palavras)
Diagramas visuais do sistema.

**Conteúdo**:
- ✅ Visão geral do sistema
- ✅ Fluxo principal (passo a passo)
- ✅ Mockups das telas
- ✅ Modal de seleção
- ✅ Diagrama de estados
- ✅ Matriz de permissões
- ✅ Fluxo de dados (arquitetura)
- ✅ Cálculo de métricas
- ✅ Camadas tecnológicas

**Use para**: Entender visualmente o sistema

---

### 🔧 Instalação e Setup

#### **[INSTALL_DOCKER.md](INSTALL_DOCKER.md)**
Guia de instalação do Docker no WSL.

**Conteúdo**:
- ✅ Opção 1: Docker Desktop (recomendado)
- ✅ Opção 2: Docker Engine no WSL
- ✅ Verificação da instalação
- ✅ URLs de acesso
- ✅ Credenciais padrão

**Use para**: Instalar Docker antes de rodar o projeto

---

#### **[setup.sh](setup.sh)**
Script automatizado de inicialização.

**Uso**:
```bash
./setup.sh
```

**Faz automaticamente**:
- ✅ Verifica Docker instalado
- ✅ Cria .env se não existir
- ✅ Para containers antigos
- ✅ Inicia todos os serviços
- ✅ Aguarda inicialização
- ✅ Mostra status e instruções

**Use para**: Iniciar o sistema com um comando

---

### ✅ Validação e Testes

#### **[VALIDACAO.md](VALIDACAO.md)** (4.000+ palavras)
Checklist completo de validação do MVP.

**Conteúdo**: 120+ itens agrupados em:
- ✅ Estrutura do projeto
- ✅ Backend - Modelos e Database
- ✅ Backend - API Endpoints
- ✅ Frontend - Páginas
- ✅ Funcionalidades específicas
- ✅ Validações
- ✅ Docker e Deploy
- ✅ Dados seed
- ✅ Segurança
- ✅ Documentação
- ✅ Teste de aceitação (manual - 10 passos)

**Use para**: Validar que tudo foi implementado

---

### 🔥 Troubleshooting

#### **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** (3.000+ palavras)
Guia de solução de problemas.

**Conteúdo**: 10 problemas comuns + soluções:
1. Docker não encontrado
2. Portas já em uso
3. Migrations falham
4. Frontend não conecta ao backend
5. Login falha
6. Seed não executou
7. Calendário não funciona
8. Token inválido ou expirado
9. Export CSV falha
10. Containers não param

**Plus**:
- ✅ Logs e debugging
- ✅ Resetar tudo
- ✅ Performance
- ✅ Problemas específicos do WSL
- ✅ Verificação de saúde

**Use para**: Resolver problemas durante instalação/uso

---

### 📁 Arquivos de Código

#### Backend (Python)

**Estrutura**:
```
backend/
├── app/
│   ├── main.py              # FastAPI app principal
│   ├── config.py            # Configurações
│   ├── database.py          # SQLAlchemy setup
│   ├── auth.py              # JWT auth
│   ├── utils.py             # Utilities
│   ├── models/              # SQLAlchemy models (5 arquivos)
│   ├── schemas/             # Pydantic schemas (5 arquivos)
│   └── api/                 # API routes (4 arquivos)
├── alembic/
│   └── versions/
│       └── 001_initial_schema.py  # Migration
└── seed_data.py             # Seed script
```

**Arquivos principais**:

1. **[backend/app/main.py](backend/app/main.py)**
   - FastAPI app
   - CORS configuration
   - Router includes
   - Login endpoint

2. **[backend/app/models/macro_period.py](backend/app/models/macro_period.py)**
   - Modelo principal
   - Status enum
   - Relationships

3. **[backend/app/api/macro_periods.py](backend/app/api/macro_periods.py)**
   - CRUD macro períodos
   - Cálculo de métricas
   - Export CSV
   - Ações (unlock/confirm/cancel)

4. **[backend/app/api/public.py](backend/app/api/public.py)**
   - Endpoint público (sem auth)
   - GET macro período por token
   - POST resposta do médico

5. **[backend/seed_data.py](backend/seed_data.py)**
   - Cria 5 unidades
   - Cria 30 médicos

#### Frontend (Next.js + TypeScript)

**Estrutura**:
```
frontend/src/
├── app/
│   ├── page.tsx                         # Login
│   ├── admin/
│   │   ├── layout.tsx                   # Admin layout
│   │   └── macro-periods/
│   │       ├── page.tsx                 # Lista
│   │       └── [id]/
│   │           └── page.tsx             # Detalhe
│   └── p/
│       └── [token]/
│           └── page.tsx                 # Médico (público)
├── lib/
│   ├── api.ts                           # API client
│   └── types.ts                         # TypeScript types
└── styles/
    └── globals.css                      # Tailwind + rdp
```

**Arquivos principais**:

1. **[frontend/src/app/page.tsx](frontend/src/app/page.tsx)**
   - Página de login
   - Form handling
   - JWT storage

2. **[frontend/src/app/admin/macro-periods/page.tsx](frontend/src/app/admin/macro-periods/page.tsx)**
   - Lista de macro períodos
   - Formulário de criação
   - Filtros e ordenação
   - Cálculo de dias em aberto

3. **[frontend/src/app/admin/macro-periods/[id]/page.tsx](frontend/src/app/admin/macro-periods/[id]/page.tsx)**
   - Detalhe do macro período
   - Exibição de seleções
   - Audit trail
   - Ações (unlock/confirm/cancel/export)

4. **[frontend/src/app/p/[token]/page.tsx](frontend/src/app/p/[token]/page.tsx)**
   - Interface do médico
   - Calendário interativo (react-day-picker)
   - Modal de seleção
   - Validações
   - Confirmação

5. **[frontend/src/lib/api.ts](frontend/src/lib/api.ts)**
   - Axios client
   - All API methods
   - JWT interceptor

6. **[frontend/src/lib/types.ts](frontend/src/lib/types.ts)**
   - TypeScript interfaces
   - Enums
   - API response types

#### Configuração

1. **[docker-compose.yml](docker-compose.yml)**
   - 3 serviços: db, backend, frontend
   - Networks e volumes
   - Startup commands

2. **[.env.example](.env.example)**
   - Template de variáveis
   - Credenciais padrão
   - URLs

3. **[backend/requirements.txt](backend/requirements.txt)**
   - Dependências Python

4. **[frontend/package.json](frontend/package.json)**
   - Dependências Node.js

## 🗺️ Mapa de Navegação

### Por Objetivo

#### "Quero entender o que foi feito"
→ [RESUMO_ENTREGA.md](RESUMO_ENTREGA.md)

#### "Quero entender como funciona"
→ [FLUXO_VISUAL.md](FLUXO_VISUAL.md)

#### "Quero instalar e rodar"
→ [INSTALL_DOCKER.md](INSTALL_DOCKER.md) → [README.md](README.md)

#### "Quero validar a implementação"
→ [VALIDACAO.md](VALIDACAO.md)

#### "Estou com problema"
→ [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

#### "Quero detalhes técnicos"
→ [README.md](README.md) → Código-fonte

#### "Quero apresentar para alguém"
→ [RESUMO_ENTREGA.md](RESUMO_ENTREGA.md) + [FLUXO_VISUAL.md](FLUXO_VISUAL.md)

### Por Persona

#### Desenvolvedor
1. [README.md](README.md) - Documentação técnica
2. Código-fonte (backend/ e frontend/)
3. [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

#### Gestor / Product Owner
1. [RESUMO_ENTREGA.md](RESUMO_ENTREGA.md)
2. [VALIDACAO.md](VALIDACAO.md)
3. [FLUXO_VISUAL.md](FLUXO_VISUAL.md)

#### DevOps / Infra
1. [INSTALL_DOCKER.md](INSTALL_DOCKER.md)
2. [docker-compose.yml](docker-compose.yml)
3. [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

#### QA / Tester
1. [VALIDACAO.md](VALIDACAO.md)
2. [README.md](README.md) - Fluxo de uso
3. [FLUXO_VISUAL.md](FLUXO_VISUAL.md)

## 📊 Estatísticas da Documentação

- **Total de arquivos de documentação**: 7 MD + 1 SH
- **Total de palavras**: ~30.000+
- **Total de linhas de código**: ~5.000+
- **Arquivos de código**: 50+
- **Tempo estimado de leitura**: 2-3 horas (toda documentação)

## 🎯 Quick Links

### URLs (quando sistema estiver rodando)
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### Credenciais Padrão
- **Email**: admin@example.com
- **Senha**: admin123

### Comandos Essenciais
```bash
# Iniciar
./setup.sh
# ou
docker compose up --build

# Parar
docker compose down

# Logs
docker compose logs -f

# Resetar tudo
docker compose down -v
docker compose up --build
```

## 📧 Informações de Contato

Para suporte ou dúvidas:
1. Consulte a documentação primeiro
2. Verifique [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Revise o código-fonte (muito comentado)

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0 - MVP Completo
**Status**: ✅ Pronto para Uso

**Navegue pela documentação usando os links acima!**
