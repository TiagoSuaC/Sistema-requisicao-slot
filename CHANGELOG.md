# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [2.0.0] - 2026-01-08

### Adicionado
- **Sistema Multi-Unidade**: Permite criar macro períodos com múltiplas unidades simultaneamente
- **Validação de Conflitos em Tempo Real**: Detecta e alerta sobre sobreposição de horários
- **Workflow Draft/Confirm**: Médicos podem salvar rascunhos antes de confirmar definitivamente
- **Modal de Revisão**: Tabela completa para revisar seleções antes de confirmar
- **Exportar para Google Calendar**: Botão para adicionar eventos automaticamente no Google Calendar
- **Exportar para iPhone/Apple**: Link webcal:// para adição direta no app Calendário
- **Endpoint `/calendar-feed`**: Feed permanente para assinatura de calendário
- **Resumo na Confirmação**: Total de dias e alocações exibidos no modal

### Modificado
- Refatorado geração de calendário (código reutilizável)
- Melhorado UX do calendário com cores por unidade
- Otimizado fluxo de confirmação com menos cliques

### Corrigido
- Validação de conflitos agora funciona corretamente para períodos sobrepostos
- Botões de calendário agora aparecem apenas após resposta confirmada

## [1.0.0] - 2025-12-17

### Adicionado
- **MVP Inicial**: Sistema completo de gestão de macro períodos
- **Backend FastAPI**: API REST completa com autenticação JWT
- **Frontend Next.js**: Interface administrativa e página pública para médicos
- **Docker Compose**: Setup completo para desenvolvimento e produção
- **Modelo de Dados**: 6 tabelas (units, doctors, macro_periods, macro_period_units, selections, audit_events)
- **Autenticação**: Login admin com JWT
- **Calendário Interativo**: Seleção de dias com react-day-picker
- **Períodos Flexíveis**: Dia Inteiro, Manhã, Tarde, Personalizado
- **Audit Trail**: Histórico imutável de todas as ações
- **Métricas SLA**: Dias em Aberto, Tempo até Resposta
- **Exportar CSV**: Download de seleções em formato CSV
- **Status Workflow**: AGUARDANDO → RESPONDIDO → CONFIRMADO/CANCELADO
- **Seed Data**: 5 unidades + 30 médicos pré-cadastrados
- **Documentação**: README, COMECE_AQUI, FLUXO_VISUAL, VALIDACAO, TROUBLESHOOTING

### Segurança
- Token público de 256 bits
- JWT para autenticação administrativa
- Validação server-side de todos os inputs
- CORS configurado

### Performance
- Async/await em endpoints
- Connection pooling no banco
- Índices em campos críticos

---

## Tipos de Mudanças
- `Adicionado` para novas funcionalidades
- `Modificado` para mudanças em funcionalidades existentes
- `Obsoleto` para funcionalidades que serão removidas
- `Removido` para funcionalidades removidas
- `Corrigido` para correção de bugs
- `Segurança` para vulnerabilidades

---

## Links
- [Repositório](https://github.com/TiagoSuaC/Sistema-requisicao-slot)
- [Issues](https://github.com/TiagoSuaC/Sistema-requisicao-slot/issues)
- [Pull Requests](https://github.com/TiagoSuaC/Sistema-requisicao-slot/pulls)
