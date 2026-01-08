# Product Requirements Document (PRD)
# Sistema de Gestão de Macro Períodos

**Versão**: 2.0.0
**Data**: Janeiro 2026
**Status**: Em Desenvolvimento
**Proprietário do Produto**: Equipe de Operações Médicas

---

## 1. Visão Geral do Produto

### 1.1 Objetivo
Automatizar o processo de coleta, validação e gestão da disponibilidade de médicos para plantões em múltiplas unidades de saúde, substituindo processos manuais via WhatsApp/planilhas por um sistema centralizado e eficiente.

### 1.2 Problema que Resolve
- **Antes**: Gestão manual via WhatsApp com alta taxa de erro, retrabalho, e dificuldade de consolidação
- **Depois**: Sistema automático com validação em tempo real, métricas, e workflow estruturado

### 1.3 Valor do Negócio
- ⏱️ **Redução de 80% no tempo** de coleta de disponibilidade
- ✅ **Eliminação de conflitos** de horários através de validação automática
- 📊 **Visibilidade total** com métricas de SLA e audit trail
- 📱 **Experiência móvel** otimizada para médicos

---

## 2. Personas

### 2.1 Coordenador de Operações (Usuário Principal)
- **Quem**: Profissional responsável pela escala médica
- **Objetivo**: Coletar disponibilidade de 50+ médicos mensalmente
- **Dores**: Retrabalho, erros humanos, dificuldade de rastreamento
- **Ganhos**: Automação, rastreabilidade, relatórios

### 2.2 Médico (Usuário Secundário)
- **Quem**: Profissional que precisa informar disponibilidade
- **Objetivo**: Informar dias/horários disponíveis rapidamente
- **Dores**: Interfaces complexas, falta de flexibilidade
- **Ganhos**: Interface simples, revisão antes de confirmar, integração com agenda

### 2.3 Gestor de Unidade (Stakeholder)
- **Quem**: Responsável pela unidade de saúde
- **Objetivo**: Garantir cobertura adequada de médicos
- **Dores**: Falta de visibilidade, atrasos na escala
- **Ganhos**: Dashboards, métricas, previsibilidade

---

## 3. Requisitos Funcionais

### 3.1 Gestão de Macro Períodos

#### RF001: Criar Macro Período Multi-Unidade
**Prioridade**: P0 (Crítico)
**Status**: ✅ Implementado

**Como** Coordenador
**Quero** criar um macro período com múltiplas unidades
**Para** coletar disponibilidade do médico em várias localidades simultaneamente

**Critérios de Aceitação**:
- [ ] Sistema permite adicionar 1+ unidades ao macro período
- [ ] Cada unidade tem quantidade específica de dias necessários
- [ ] Sistema gera token único e seguro (256 bits)
- [ ] Link é copiado automaticamente para área de transferência
- [ ] Auditoria registra criação com timestamp e usuário

**Regras de Negócio**:
- Mínimo: 1 unidade
- Máximo: 10 unidades por macro período
- Total de dias por unidade: 1-90 dias
- Período macro: 1-365 dias

---

#### RF002: Validação de Conflitos em Tempo Real
**Prioridade**: P0 (Crítico)
**Status**: ✅ Implementado

**Como** Médico
**Quero** ser alertado sobre conflitos de horário
**Para** não marcar dois lugares ao mesmo tempo

**Critérios de Aceitação**:
- [ ] Sistema valida sobreposição de períodos (FULL_DAY, MORNING, AFTERNOON)
- [ ] Alerta visual aparece antes de salvar
- [ ] Modal de revisão mostra todos os conflitos detectados
- [ ] Não permite confirmar se houver conflitos

**Regras de Negócio**:
- DIA INTEIRO bloqueia manhã E tarde
- MANHÃ + TARDE no mesmo dia em DIFERENTES unidades = OK
- MANHÃ + MANHÃ no mesmo dia = CONFLITO
- DIA INTEIRO + qualquer outro período = CONFLITO

---

#### RF003: Workflow Draft/Confirm
**Prioridade**: P0 (Crítico)
**Status**: ✅ Implementado

**Como** Médico
**Quero** salvar rascunho antes de confirmar
**Para** poder revisar e editar múltiplas vezes

**Critérios de Aceitação**:
- [ ] Botão "Salvar Rascunho" sempre disponível
- [ ] Botão "Confirmar e Enviar" abre modal de revisão
- [ ] Rascunho mantém status AGUARDANDO ou EDICAO_LIBERADA
- [ ] Confirmação muda status para RESPONDIDO
- [ ] Após confirmar, edição fica bloqueada

**Estados do Sistema**:
```
AGUARDANDO → (salvar rascunho) → AGUARDANDO
AGUARDANDO → (confirmar) → RESPONDIDO
RESPONDIDO → (admin libera) → EDICAO_LIBERADA
EDICAO_LIBERADA → (confirmar) → RESPONDIDO
```

---

#### RF004: Modal de Revisão Antes de Confirmar
**Prioridade**: P1 (Alto)
**Status**: ✅ Implementado

**Como** Médico
**Quero** revisar todas minhas seleções em formato tabular
**Para** garantir que está tudo correto antes de confirmar

**Critérios de Aceitação**:
- [ ] Modal exibe tabela com: Data, Unidade, Período, Horário
- [ ] Seleções ordenadas por data
- [ ] Aviso destacado sobre impossibilidade de edição após confirmar
- [ ] Resumo com total de dias e alocações
- [ ] Botões: "Voltar e Editar" e "Confirmar e Enviar"

---

#### RF005: Exportar para Google Calendar e iPhone
**Prioridade**: P1 (Alto)
**Status**: ✅ Implementado

**Como** Médico
**Quero** adicionar automaticamente à minha agenda
**Para** não precisar transcrever manualmente

**Critérios de Aceitação**:
- [ ] Botão "Google Calendar" baixa .ics e abre instruções
- [ ] Botão "iPhone/Apple" abre link webcal:// direto no app Calendário
- [ ] Arquivo .ics contém todos os eventos com horários corretos
- [ ] Eventos incluem: título (unidade), localização, descrição
- [ ] Funciona em dispositivos móveis

**Endpoints**:
- `/api/public/macro-period/{token}/calendar` - Download .ics
- `/api/public/macro-period/{token}/calendar-feed` - Feed webcal://

---

### 3.2 Interface do Médico

#### RF006: Calendário Interativo com Blocos
**Prioridade**: P0 (Crítico)
**Status**: ✅ Implementado

**Critérios de Aceitação**:
- [ ] Médico seleciona data inicial
- [ ] Sistema automaticamente seleciona N dias consecutivos (conforme unidade)
- [ ] Modal permite configurar cada dia individualmente
- [ ] Opção "Marcar todos como Dia Inteiro" para agilizar
- [ ] Visual diferenciado por unidade (cores)
- [ ] Suporta múltiplos blocos na mesma data (diferentes unidades)

---

#### RF007: Períodos Flexíveis
**Prioridade**: P0 (Crítico)
**Status**: ✅ Implementado

Opções disponíveis:
- ⏰ **Dia Inteiro**: 08:00-18:00
- 🌅 **Manhã**: 08:00-12:00
- 🌆 **Tarde**: 14:00-18:00
- 🕐 **Personalizado**: Usuário define início e fim

---

### 3.3 Painel Administrativo

#### RF008: Lista de Macro Períodos com Filtros
**Prioridade**: P0 (Crítico)
**Status**: ✅ Implementado

**Filtros disponíveis**:
- Unidade
- Médico
- Status
- Período (data início/fim)

**Ordenação**:
- Dias em Aberto (destaque >= 4 dias)
- Data de criação
- Status

---

#### RF009: Detalhes com Audit Trail
**Prioridade**: P1 (Alto)
**Status**: ✅ Implementado

**Visão inclui**:
- Informações básicas (médico, unidades, período)
- Tabela de seleções (Data | Unidade | Período | Horário)
- Timeline de eventos (audit trail)
- Ações disponíveis por status
- Botão "Exportar CSV"

---

#### RF010: Ações do Coordenador
**Prioridade**: P0 (Crítico)
**Status**: ✅ Implementado

Ações disponíveis:
- ✏️ **Liberar Edição**: RESPONDIDO → EDICAO_LIBERADA
- ✅ **Confirmar**: RESPONDIDO → CONFIRMADO
- ❌ **Cancelar**: Qualquer estado → CANCELADO
- 📥 **Exportar CSV**: Download de todas as seleções

---

## 4. Requisitos Não-Funcionais

### 4.1 Performance
- **RNF001**: Resposta de API < 200ms (p95)
- **RNF002**: Carregamento de página < 2s
- **RNF003**: Suportar 100+ macro períodos simultâneos

### 4.2 Segurança
- **RNF004**: Token público com 256 bits de entropia
- **RNF005**: JWT para autenticação administrativa
- **RNF006**: HTTPS obrigatório em produção
- **RNF007**: Validação de inputs em backend e frontend
- **RNF008**: Rate limiting: 100 req/min por IP

### 4.3 Usabilidade
- **RNF009**: Interface responsiva (mobile-first)
- **RNF010**: Suporte a navegadores modernos (Chrome, Safari, Firefox, Edge)
- **RNF011**: Acessibilidade WCAG 2.1 nível AA
- **RNF012**: Feedback visual para todas as ações

### 4.4 Confiabilidade
- **RNF013**: Uptime 99.5%
- **RNF014**: Backup automático do banco (diário)
- **RNF015**: Audit trail imutável de todas as ações

### 4.5 Manutenibilidade
- **RNF016**: Cobertura de testes: backend 80%, frontend 60%
- **RNF017**: Documentação de API completa (OpenAPI 3.0)
- **RNF018**: Logs estruturados (JSON)

---

## 5. Métricas de Sucesso (KPIs)

### 5.1 Operacionais
| Métrica | Baseline | Meta |
|---------|----------|------|
| Tempo médio de coleta | 5 dias | < 2 dias |
| Taxa de erros | 15% | < 2% |
| Retrabalho | 30% | < 5% |
| Taxa de resposta | 70% | > 90% |

### 5.2 Técnicas
| Métrica | Meta |
|---------|------|
| Disponibilidade | 99.5% |
| Tempo de resposta (p95) | < 200ms |
| Taxa de erro | < 0.1% |
| Tempo de deploy | < 10min |

### 5.3 Usuário
| Métrica | Meta |
|---------|------|
| NPS (Coordenadores) | > 8 |
| NPS (Médicos) | > 7 |
| Taxa de adoção | > 95% |

---

## 6. Roadmap

### Versão 2.0 (Atual) ✅
- [x] Sistema multi-unidade
- [x] Validação de conflitos
- [x] Workflow draft/confirm
- [x] Modal de revisão
- [x] Exportar para calendários

### Versão 2.1 (Q1 2026) 🚧
- [ ] Notificações por email
- [ ] Dashboard com métricas
- [ ] Histórico de macro períodos
- [ ] Busca avançada

### Versão 3.0 (Q2 2026) 📋
- [ ] App móvel nativo (iOS/Android)
- [ ] Integração com SISDADO
- [ ] IA para sugestões de escala
- [ ] Multi-tenancy (múltiplos clientes)

### Versão 4.0 (Q3-Q4 2026) 💭
- [ ] Analytics avançado
- [ ] Otimização automática de escalas
- [ ] Marketplace de médicos
- [ ] API pública para integrações

---

## 7. Dependências e Riscos

### 7.1 Dependências Técnicas
- PostgreSQL 16+
- Python 3.12+
- Node.js 20+
- Docker / Docker Compose

### 7.2 Dependências de Negócio
- Aprovação da equipe de compliance
- Treinamento de coordenadores
- Onboarding de médicos

### 7.3 Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Baixa adoção por médicos | Média | Alto | UX simplificada, treinamento |
| Resistência à mudança | Alta | Médio | Change management, pilotos |
| Problemas de integração | Baixa | Alto | Testes extensivos, staging |
| Sobrecarga do sistema | Baixa | Alto | Load testing, escalabilidade |

---

## 8. Critérios de Aceitação do Produto

### Release Gate Checklist
- [ ] Todos os RF P0 implementados e testados
- [ ] Todos os RNF críticos validados
- [ ] Documentação completa (PRD, API, Arquitetura)
- [ ] Testes de carga aprovados (100+ usuários simultâneos)
- [ ] Segurança validada (penetration test)
- [ ] Treinamento de usuários realizado
- [ ] Plano de rollback documentado

---

## 9. Fora do Escopo (Out of Scope)

Explicitamente NÃO incluído nesta versão:
- ❌ Gestão de pacientes
- ❌ Prontuário eletrônico
- ❌ Faturamento
- ❌ Folha de pagamento
- ❌ Controle de ponto
- ❌ App mobile nativo (v3.0)
- ❌ Múltiplos idiomas (apenas PT-BR)

---

## 10. Glossário

| Termo | Definição |
|-------|-----------|
| **Macro Período** | Período de tempo (ex: 30 dias) para o qual se coleta disponibilidade |
| **Unidade** | Local físico onde médico pode trabalhar (ex: Hospital Criciúma) |
| **Bloco** | Conjunto de dias consecutivos selecionados de uma vez |
| **Período** | Parte do dia (Manhã, Tarde, Dia Inteiro, Personalizado) |
| **Draft** | Seleção salva mas não confirmada |
| **Conflito** | Sobreposição de horários na mesma data |
| **SLA** | Service Level Agreement - Tempo de resposta esperado |
| **Audit Trail** | Histórico imutável de todas as ações no sistema |
| **Token** | Identificador único e seguro do macro período |

---

## 11. Contatos

| Papel | Nome | Email |
|-------|------|-------|
| Product Owner | - | - |
| Tech Lead | - | - |
| UX Designer | - | - |
| QA Lead | - | - |

---

**Última Atualização**: Janeiro 2026
**Próxima Revisão**: Fevereiro 2026
