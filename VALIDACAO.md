# Checklist de Validação do MVP

Use este documento para validar que todos os requisitos foram implementados corretamente.

## ✅ Estrutura do Projeto

- [ ] Diretório `backend/` existe com código Python
- [ ] Diretório `frontend/` existe com código Next.js
- [ ] Arquivo `docker-compose.yml` configurado
- [ ] Arquivo `.env.example` presente
- [ ] Arquivo `README.md` com instruções completas

## ✅ Backend - Modelos e Database

### Modelos Implementados
- [ ] **Unit** (Unidade): id, name, city, config_turnos
- [ ] **Doctor** (Médico): id, name, email, active
- [ ] **MacroPeriod**: id, unit_id, doctor_id, start_date, end_date, suggested_min/max, status, public_token, created_at, created_by, responded_at
- [ ] **MacroPeriodSelection**: id, macro_period_id, date, part_of_day, custom_start/end, type
- [ ] **AuditEvent**: id, macro_period_id, event_type, payload, created_at, created_by

### Status Implementados
- [ ] AGUARDANDO
- [ ] RESPONDIDO
- [ ] EDICAO_LIBERADA
- [ ] CONFIRMADO
- [ ] CANCELADO
- [ ] EXPIRADO

### Enums Implementados
- [ ] PartOfDay: MORNING, AFTERNOON, FULL_DAY, CUSTOM
- [ ] SelectionType: SURGERY, CONSULT
- [ ] EventType: CREATED, LINK_VIEWED, RESPONDED, UNLOCKED, UPDATED, CONFIRMED, CANCELLED

## ✅ Backend - API Endpoints

### Públicos (Sem Auth)
- [ ] `GET /public/macro-period/{token}` - Ver macro período
- [ ] `POST /public/macro-period/{token}/response` - Enviar resposta

### Autenticados
- [ ] `POST /auth/login` - Login e obtenção de JWT
- [ ] `GET /units` - Listar unidades
- [ ] `POST /units` - Criar unidade
- [ ] `GET /doctors` - Listar médicos
- [ ] `POST /doctors` - Criar médico
- [ ] `POST /macro-periods` - Criar macro período
- [ ] `GET /macro-periods` - Listar com filtros
- [ ] `GET /macro-periods/{id}` - Detalhe
- [ ] `POST /macro-periods/{id}/unlock` - Liberar edição
- [ ] `POST /macro-periods/{id}/confirm` - Confirmar
- [ ] `POST /macro-periods/{id}/cancel` - Cancelar
- [ ] `GET /macro-periods/{id}/export.csv` - Export CSV

## ✅ Frontend - Páginas

### Autenticação
- [ ] Página de Login (`/`)
- [ ] Proteção de rotas admin
- [ ] Logout funcional

### Admin
- [ ] `/admin/macro-periods` - Lista de macro períodos
- [ ] Formulário de criação inline
- [ ] Filtros (unidade, médico, status)
- [ ] Ordenação por "Dias em Aberto"
- [ ] `/admin/macro-periods/{id}` - Página de detalhe
- [ ] Exibição de seleções do médico
- [ ] Histórico de eventos (audit trail)
- [ ] Botões de ação (unlock, confirm, cancel, export)

### Público
- [ ] `/p/{token}` - Página do médico
- [ ] Calendário interativo
- [ ] Modal de seleção de tipo/período
- [ ] Lista de seleções
- [ ] Confirmação de resposta
- [ ] Bloqueio quando não pode editar

## ✅ Funcionalidades Específicas

### Criação de Macro Período
- [ ] Seleção de Unidade
- [ ] Seleção de Médico
- [ ] Seleção de Período (start/end date)
- [ ] Campos opcionais de min/max sugeridos
- [ ] Geração automática de token público forte
- [ ] Cópia automática do link para clipboard
- [ ] Registro de evento CREATED no audit trail

### Resposta do Médico
- [ ] Calendário mostra apenas período macro habilitado
- [ ] Clique no dia abre modal
- [ ] Seleção de Tipo (Cirurgia/Consulta)
- [ ] Seleção de Período:
  - [ ] Dia Inteiro
  - [ ] Manhã (usa config da unidade)
  - [ ] Tarde (usa config da unidade)
  - [ ] Horário Específico (custom start/end)
- [ ] Validação: início < fim para horário customizado
- [ ] Permitir até 2 blocos por dia
- [ ] Remover seleções antes de confirmar
- [ ] Validação de sugestões (warning se abaixo do min)
- [ ] Confirmação trava edição (status → RESPONDIDO)

### SLA e Métricas
- [ ] Cálculo de "Dias em Aberto" para status AGUARDANDO
- [ ] Destaque visual (vermelho) quando >= 4 dias
- [ ] Cálculo de "Tempo até Resposta" quando respondido
- [ ] Exibição na lista e no detalhe

### Controle de Edição
- [ ] Médico só pode editar quando status = AGUARDANDO ou EDICAO_LIBERADA
- [ ] Admin pode liberar edição (RESPONDIDO/CONFIRMADO → EDICAO_LIBERADA)
- [ ] Admin pode confirmar (RESPONDIDO/EDICAO_LIBERADA → CONFIRMADO)
- [ ] Admin pode cancelar (qualquer status → CANCELADO)

### Audit Trail
- [ ] Registro automático de CREATED
- [ ] Registro automático de LINK_VIEWED (primeira vez)
- [ ] Registro automático de RESPONDED (primeira resposta)
- [ ] Registro automático de UPDATED (edições)
- [ ] Registro automático de UNLOCKED
- [ ] Registro automático de CONFIRMED
- [ ] Registro automático de CANCELLED
- [ ] Exibição completa no detalhe do macro período

### Export
- [ ] Botão "Exportar CSV" no detalhe
- [ ] CSV contém: Data, Tipo, Período, Início, Fim
- [ ] Download automático do arquivo

## ✅ Validações

### Backend
- [ ] Validação: end_date >= start_date
- [ ] Validação: date da seleção dentro do período macro
- [ ] Validação: custom_start < custom_end
- [ ] Validação: pode editar apenas se status permitir
- [ ] Validação: unidade e médico existem

### Frontend
- [ ] Validação: todos campos obrigatórios preenchidos
- [ ] Validação: datas no formato correto
- [ ] Validação: máximo 2 blocos por dia
- [ ] Validação: não pode selecionar fora do período
- [ ] Warning: sugestões de min/max

## ✅ Docker e Deploy

- [ ] `docker-compose.yml` com 3 serviços (db, backend, frontend)
- [ ] PostgreSQL 16
- [ ] Python 3.12
- [ ] Node 20
- [ ] Migrations automáticas no startup
- [ ] Seed automático no startup
- [ ] Volumes persistentes para PostgreSQL

## ✅ Dados Seed

- [ ] 5 unidades criadas (Criciúma, Florianópolis, BC, Joinville, Curitiba)
- [ ] 30 médicos criados (doctor1@example.com até doctor30@example.com)
- [ ] Configuração padrão de turnos (manhã 08:00-12:00, tarde 13:00-17:00)

## ✅ Segurança

- [ ] Token público forte (32 bytes / 256 bits)
- [ ] JWT para autenticação interna
- [ ] Validação de permissões antes de editar
- [ ] CORS configurado (MVP aceita todas origens)

## ✅ Documentação

- [ ] README.md completo com:
  - [ ] Descrição do sistema
  - [ ] Instruções de instalação
  - [ ] Instruções de uso
  - [ ] Fluxo operacional
  - [ ] Tabela de status
  - [ ] Modelo de dados
  - [ ] Endpoints da API
  - [ ] Comandos úteis
  - [ ] Decisões de design
  - [ ] Limitações do MVP
  - [ ] Recomendações de segurança

## 🧪 Teste de Aceitação (Manual)

Quando o Docker estiver instalado e o sistema rodando, execute:

### 1. Login Admin
- [ ] Acessar http://localhost:3000
- [ ] Login com admin@example.com / admin123
- [ ] Redirecionar para lista de macro períodos

### 2. Criar Macro Período
- [ ] Clicar "Criar Macro Período"
- [ ] Selecionar Unidade: Criciúma
- [ ] Selecionar Médico: Dr. João Silva
- [ ] Período: hoje + 7 dias até hoje + 30 dias
- [ ] Cirurgias sugeridas: min 3, max 5
- [ ] Consultas sugeridas: min 2, max 4
- [ ] Clicar "Criar e Gerar Link"
- [ ] Verificar alerta com link
- [ ] Verificar que aparece na lista com status AGUARDANDO
- [ ] Verificar "Dias em Aberto" = 0

### 3. Resposta do Médico
- [ ] Abrir link em aba anônima (ou outro navegador)
- [ ] Verificar contexto exibido corretamente
- [ ] Clicar em um dia do calendário
- [ ] Selecionar "Cirurgia" + "Manhã"
- [ ] Adicionar seleção
- [ ] Clicar em outro dia
- [ ] Selecionar "Cirurgia" + "Dia Inteiro"
- [ ] Adicionar seleção
- [ ] Clicar em mais um dia
- [ ] Selecionar "Consulta" + "Tarde"
- [ ] Adicionar seleção
- [ ] Clicar no mesmo dia
- [ ] Selecionar "Consulta" + "Horário Específico" (09:00 - 11:00)
- [ ] Adicionar seleção
- [ ] Verificar 4 seleções na lista
- [ ] Clicar "Confirmar Disponibilidade"
- [ ] Verificar mensagem de sucesso
- [ ] Verificar que não pode mais editar

### 4. Admin - Ver Resposta
- [ ] Voltar ao admin
- [ ] Verificar status mudou para RESPONDIDO
- [ ] Verificar "Tempo até Resposta" aparece
- [ ] Clicar "Ver Detalhes"
- [ ] Verificar tabela de seleções
- [ ] Verificar audit trail com eventos

### 5. Admin - Liberar Edição
- [ ] Clicar "Liberar Edição"
- [ ] Verificar status mudou para EDICAO_LIBERADA
- [ ] Verificar evento no audit trail

### 6. Médico - Editar
- [ ] Voltar ao link público
- [ ] Verificar que pode editar novamente
- [ ] Remover uma seleção
- [ ] Adicionar nova seleção
- [ ] Confirmar novamente
- [ ] Verificar status volta para RESPONDIDO
- [ ] Verificar evento UPDATED no audit trail

### 7. Admin - Confirmar
- [ ] Voltar ao admin
- [ ] Clicar "Confirmar"
- [ ] Verificar status mudou para CONFIRMADO
- [ ] Verificar evento no audit trail

### 8. Admin - Exportar
- [ ] Clicar "Exportar CSV"
- [ ] Verificar download do arquivo
- [ ] Abrir CSV e verificar dados corretos

### 9. Filtros e Ordenação
- [ ] Criar mais alguns macro períodos
- [ ] Testar filtro por unidade
- [ ] Testar filtro por médico
- [ ] Testar filtro por status
- [ ] Marcar "Ordenar por dias em aberto"
- [ ] Verificar que AGUARDANDO aparecem primeiro, ordenados por data criação

### 10. Dias em Aberto >= 4
Como não podemos avançar o tempo facilmente, verificar:
- [ ] Código em `backend/app/api/macro_periods.py` calcula corretamente
- [ ] Frontend em `frontend/src/app/admin/macro-periods/page.tsx` mostra vermelho quando >= 4

## 📊 Resultado

**Total de itens**: ~120+

Marque cada item conforme valida. Todos devem estar ✅ para o MVP ser considerado completo.

---

**Data de Validação**: _________________

**Validado por**: _________________

**Status**: [ ] Aprovado [ ] Pendente [ ] Reprovado

**Observações**:
