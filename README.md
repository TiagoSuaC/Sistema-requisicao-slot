# Sistema de Gestão de Macro Períodos e Aprovação de Disponibilidade de Médicos

MVP completo para gerenciamento de disponibilidade de médicos através de macro períodos com interface administrativa e link público para resposta.

## 🎯 Características Principais

- **Sistema Multi-Unidade**: Crie macro períodos com múltiplas unidades simultaneamente
- **Validação de Conflitos**: Detecção automática de sobreposição de horários
- **Workflow Draft/Confirm**: Salve rascunhos antes de confirmar definitivamente
- **Modal de Revisão**: Revise todas as seleções em formato tabular antes de confirmar
- **Exportar para Calendários**: Adicione automaticamente ao Google Calendar ou iPhone/Apple Calendar
- **Painel Administrativo**: Criação, visualização e gerenciamento de macro períodos
- **Link Público Único**: Cada médico recebe link seguro para responder
- **Calendário Interativo**: Seleção visual de dias com períodos (Manhã/Tarde/Dia Inteiro/Customizado)
- **SLA e Métricas**: Dias em aberto, tempo até resposta
- **Controle de Edição**: Status com bloqueio/liberação de edição
- **Audit Trail Completo**: Histórico de todas as ações
- **Export CSV**: Exportação das respostas

## 🏗️ Arquitetura

### Backend
- **Stack**: Python 3.12 + FastAPI + SQLAlchemy 2.0 + Alembic
- **Database**: PostgreSQL 16
- **Auth**: JWT com credenciais simples (MVP)

### Frontend
- **Stack**: Next.js 14 + TypeScript + Tailwind CSS
- **Calendário**: react-day-picker

### Deploy
- **Docker Compose**: Backend, Frontend e PostgreSQL containerizados

## 📋 Requisitos

- WSL (Ubuntu) ou Linux
- Docker e Docker Compose
- Git

## 🚀 Instalação e Execução

### 1. Clone o repositório
```bash
cd /mnt/c/Users/Tiago/desenvolvimento/Sistema-requisicao-slot
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o `.env` se necessário. As credenciais padrão são:
- **Admin Email**: admin@example.com
- **Admin Password**: admin123

### 3. Inicie os containers
```bash
docker compose up --build
```

Este comando irá:
- Criar e iniciar o container do PostgreSQL
- Rodar as migrations do Alembic automaticamente
- Popular o banco com dados seed (5 unidades e 30 médicos)
- Iniciar o backend na porta 8000
- Iniciar o frontend na porta 3000

### 4. Acesse as aplicações

- **Frontend (Login)**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000/health

### 5. Login Administrativo

Acesse http://localhost:3000 e faça login com:
- Email: `admin@example.com`
- Senha: `admin123`

## 📱 Fluxo de Uso

### Operação (Admin)

1. **Login** em http://localhost:3000
2. **Criar Macro Período**:
   - Clique em "Criar Macro Período"
   - Selecione Unidade, Médico, Período (data início/fim)
   - Opcionalmente defina min/max sugeridos para cirurgias e consultas
   - Clique em "Criar e Gerar Link"
   - O link é gerado automaticamente e copiado para área de transferência
3. **Compartilhar Link** com o médico (ex: WhatsApp)
4. **Acompanhar Status** na lista:
   - Veja "Dias em Aberto" para períodos aguardando resposta
   - Filtre por unidade, médico ou status
   - Ordene por "Dias em Aberto" (destaque vermelho se >= 4 dias)
5. **Ver Detalhes** clicando em qualquer macro período:
   - Veja a resposta do médico
   - Histórico de eventos (audit trail)
   - Ações: Liberar edição, Confirmar, Cancelar
   - Export CSV das seleções

### Médico (Link Público)

1. **Abrir link** recebido (formato: http://localhost:3000/p/{TOKEN})
2. **Ver contexto**: unidade, período, sugestões
3. **Selecionar dias** clicando no calendário:
   - Apenas dias dentro do período macro estão habilitados
   - Ao clicar, abre modal para escolher:
     - **Tipo**: Cirurgia ou Consulta
     - **Período**:
       - Dia Inteiro
       - Manhã (08:00-12:00 por padrão)
       - Tarde (13:00-17:00 por padrão)
       - Horário Específico (escolha início/fim)
   - Pode adicionar até 2 blocos por dia (ex: cirurgia manhã + consulta tarde)
4. **Confirmar disponibilidade**:
   - Revisar seleções
   - Clicar em "Confirmar Disponibilidade"
   - Após confirmação, o período fica bloqueado (read-only)
5. **Editar** (se necessário):
   - Operação pode liberar edição via painel admin
   - Médico recebe o mesmo link e pode alterar

## 📊 Status e Transições

| Status | Descrição | Pode Editar? |
|--------|-----------|--------------|
| AGUARDANDO | Criado, aguardando resposta | ✅ Sim |
| RESPONDIDO | Médico respondeu | ❌ Não |
| EDICAO_LIBERADA | Admin liberou edição | ✅ Sim |
| CONFIRMADO | Admin confirmou período | ❌ Não |
| CANCELADO | Admin cancelou período | ❌ Não |
| EXPIRADO | Período expirado (futuro) | ❌ Não |

## 🔍 Regras de Negócio Implementadas

### Seleção por Dia
- **Máximo 2 blocos por dia**: Permite combinações como "cirurgia manhã + consulta tarde"
- **Validação de horário**: Horário customizado deve ter início < fim
- **Períodos padrão configuráveis**: Cada unidade pode ter turnos diferentes (manhã/tarde)
- **Validação de range**: Não pode selecionar fora do período macro

### SLA e Métricas
- **Dias em Aberto**: Calculado em tempo real para status AGUARDANDO (desde criação até hoje)
- **Tempo até Resposta**: Calculado quando respondido (dias entre criação e resposta)
- **Destaque visual**: >= 4 dias em aberto aparece em vermelho

### Audit Trail
Registra automaticamente:
- CREATED: Criação do macro período
- LINK_VIEWED: Primeira vez que médico abre o link
- RESPONDED: Primeira resposta do médico
- UPDATED: Edições subsequentes
- UNLOCKED: Admin libera edição
- CONFIRMED: Admin confirma período
- CANCELLED: Admin cancela período

## 🗄️ Modelo de Dados

### Tabelas Principais

**units** (Unidades)
- id, name, city, config_turnos (JSON)

**doctors** (Médicos)
- id, name, email, active

**macro_periods** (Macro Períodos)
- id, unit_id, doctor_id
- start_date, end_date
- suggested_surgery_min/max, suggested_consult_min/max
- status, public_token
- created_at, created_by, responded_at

**macro_period_selections** (Seleções do Médico)
- id, macro_period_id
- date, part_of_day (MORNING/AFTERNOON/FULL_DAY/CUSTOM)
- custom_start, custom_end
- type (SURGERY/CONSULT)

**audit_events** (Histórico)
- id, macro_period_id
- event_type, payload (JSON)
- created_at, created_by

## 🔧 API Endpoints

### Público (Sem Auth)
- `GET /public/macro-period/{token}` - Ver macro período por token
- `POST /public/macro-period/{token}/response` - Enviar resposta
- `GET /public/macro-period/{token}/calendar` - Baixar arquivo .ics
- `GET /public/macro-period/{token}/calendar-feed` - Feed webcal:// para assinatura

### Autenticado (Requer Bearer Token)
- `POST /auth/login` - Login (retorna JWT)
- `GET /units` - Listar unidades
- `POST /units` - Criar unidade
- `GET /doctors` - Listar médicos
- `POST /doctors` - Criar médico
- `POST /macro-periods` - Criar macro período (gera token)
- `GET /macro-periods` - Listar com filtros e ordenação
- `GET /macro-periods/{id}` - Detalhe completo
- `POST /macro-periods/{id}/unlock` - Liberar edição
- `POST /macro-periods/{id}/confirm` - Confirmar
- `POST /macro-periods/{id}/cancel` - Cancelar
- `GET /macro-periods/{id}/export.csv` - Exportar CSV

## 🛠️ Comandos Úteis

### Parar containers
```bash
docker compose down
```

### Rebuild completo
```bash
docker compose down -v
docker compose up --build
```

### Ver logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Executar migrations manualmente
```bash
docker compose exec backend alembic upgrade head
```

### Seed manual
```bash
docker compose exec backend python seed_data.py
```

### Acessar banco de dados
```bash
docker compose exec db psql -U postgres -d macro_periods
```

## 📝 Dados Seed

O sistema cria automaticamente:

### 5 Unidades
1. Criciúma - Criciúma
2. Florianópolis - Florianópolis
3. Balneário Camboriú - BC
4. Joinville - Joinville
5. Curitiba - Curitiba

### 30 Médicos
- Dr. João Silva (doctor1@example.com)
- Dr. Maria Santos (doctor2@example.com)
- ... (até doctor30@example.com)

## 🎨 Decisões de Design

### Meio Período / Horário
**Abordagem escolhida**: Permitir até 2 blocos independentes por dia.

**Justificativa**:
- Flexibilidade: médico pode marcar "cirurgia manhã + consulta tarde" no mesmo dia
- Simplicidade: cada bloco é uma linha na tabela de seleções
- Validação: fácil de verificar (max 2 por data)

**Alternativa considerada**: Um único registro com múltiplos slots (mais complexo)

### Autenticação
**MVP usa**: Login simples com email/senha hardcoded em .env + JWT.

**Produção requer**: Tabela de usuários, hash de senhas, roles, MFA, etc.

### Token Público
**Segurança**: Token forte de 32 bytes (256 bits) gerado com `secrets.token_urlsafe()`.

**Opcional**: Pode-se adicionar hash do token no banco (não implementado no MVP para simplicidade).

## ⚠️ Limitações do MVP

- Auth simplificada (apenas 1 admin hardcoded)
- Sem paginação na lista (OK para ~100 períodos)
- Sem notificações (email/SMS)
- Sem integração com SISDADO (fora do escopo)
- Sem expiração automática de links (status EXPIRADO manual)
- CORS aberto para todos (configurar origins em produção)
- Sem rate limiting
- Sem testes automatizados

## 🔒 Segurança

### Implementado
- Token público forte (256 bits)
- JWT para auth interna
- Validação de range de datas
- Validação de status antes de editar
- HTTPS recomendado em produção (via reverse proxy)

### Recomendações para Produção
- Usar secrets manager (AWS Secrets, Vault)
- Hash de tokens públicos no banco
- Rate limiting (nginx, Cloudflare)
- WAF (Web Application Firewall)
- Backup automático do PostgreSQL
- Logs estruturados (ELK, Datadog)
- Monitoramento (Prometheus, Grafana)

## 📞 Suporte

Sistema desenvolvido como MVP para validação do fluxo de gestão de disponibilidade.

**Não usa serviços pagos/fechados**. Tudo roda local com Docker.

**Não manipula dados de pacientes/PHI**. Sistema apenas captura intenção de disponibilidade dos médicos.

## 📄 Licença

MVP para uso interno. Código proprietário.

---

**Versão**: 2.0.0
**Data**: Janeiro 2026
**Status**: Produção - Sistema Multi-Unidade com Validações Avançadas

---

## 📚 Documentação Adicional

- **[PRD.md](PRD.md)** - Product Requirements Document
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Documentação de Arquitetura
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guia de Contribuição
- **[CHANGELOG.md](CHANGELOG.md)** - Histórico de Versões
- **[COMECE_AQUI.md](COMECE_AQUI.md)** - Guia de Início Rápido
- **[FLUXO_VISUAL.md](FLUXO_VISUAL.md)** - Diagramas e Mockups
- **[VALIDACAO.md](VALIDACAO.md)** - Checklist de Validação
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Solução de Problemas
