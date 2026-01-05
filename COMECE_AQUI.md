# 👋 COMECE AQUI!

Bem-vindo ao **Sistema de Gestão de Macro Períodos e Aprovação de Disponibilidade de Médicos**.

## 🎯 O que é este sistema?

Este é um MVP completo para automatizar o processo de coleta de disponibilidade de médicos através de:
- **Painel administrativo** para operação criar macro períodos
- **Links únicos** para cada médico responder
- **Calendário interativo** para seleção de disponibilidade
- **Métricas e SLA** para acompanhamento

## 📋 O que foi entregue?

✅ **Backend completo** (Python + FastAPI + PostgreSQL)
✅ **Frontend completo** (Next.js + TypeScript + Tailwind)
✅ **Docker Compose** (pronto para rodar)
✅ **Documentação extensa** (30.000+ palavras)
✅ **Dados seed** (5 unidades + 30 médicos)

## 🚀 Como começar em 3 passos?

### Passo 1: Leia a visão geral
📄 **[RESUMO_ENTREGA.md](RESUMO_ENTREGA.md)** (5 minutos)
- O que foi implementado
- Decisões técnicas
- Como usar

### Passo 2: Instale o Docker
🐳 **[INSTALL_DOCKER.md](INSTALL_DOCKER.md)** (10-15 minutos)
- Baixe Docker Desktop: https://www.docker.com/products/docker-desktop
- Instale no Windows
- Habilite integração WSL

### Passo 3: Execute o sistema
```bash
cd /mnt/c/Users/Tiago/desenvolvimento/Sistema-requisicao-slot
./setup.sh
```

Aguarde 2-5 minutos e acesse: **http://localhost:3000**

Login: `admin@example.com` / `admin123`

## 📚 Documentação disponível

| Documento | Para que serve | Tempo de leitura |
|-----------|---------------|------------------|
| **[INDICE.md](INDICE.md)** | Índice de toda documentação | 3 min |
| **[RESUMO_ENTREGA.md](RESUMO_ENTREGA.md)** | Visão executiva | 10 min |
| **[README.md](README.md)** | Documentação técnica completa | 30 min |
| **[FLUXO_VISUAL.md](FLUXO_VISUAL.md)** | Diagramas e mockups | 15 min |
| **[VALIDACAO.md](VALIDACAO.md)** | Checklist de 120+ itens | 20 min |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Solução de problemas | 10 min |
| **[INSTALL_DOCKER.md](INSTALL_DOCKER.md)** | Instalação Docker | 5 min |

## 🎓 Por onde navegar?

### Se você é...

#### 👨‍💼 **Gestor / Product Owner**
1. [RESUMO_ENTREGA.md](RESUMO_ENTREGA.md) - O que foi entregue
2. [FLUXO_VISUAL.md](FLUXO_VISUAL.md) - Como funciona visualmente
3. [VALIDACAO.md](VALIDACAO.md) - Checklist de validação

#### 👨‍💻 **Desenvolvedor**
1. [README.md](README.md) - Documentação técnica
2. Código-fonte em `backend/` e `frontend/`
3. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Problemas comuns

#### 🧪 **QA / Tester**
1. [VALIDACAO.md](VALIDACAO.md) - Casos de teste
2. [README.md](README.md) - Fluxos de uso
3. [FLUXO_VISUAL.md](FLUXO_VISUAL.md) - Telas esperadas

#### 🔧 **DevOps**
1. [INSTALL_DOCKER.md](INSTALL_DOCKER.md) - Setup
2. [docker-compose.yml](docker-compose.yml) - Infraestrutura
3. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Debug

## ❓ Perguntas frequentes

### Preciso instalar mais alguma coisa além do Docker?
Não. Docker + Docker Compose são suficientes.

### Posso usar em produção?
Este é um MVP. Para produção, revise [README.md](README.md#segurança) sobre hardening.

### O sistema manipula dados de pacientes?
Não. Este sistema apenas captura **intenção de disponibilidade** dos médicos.

### Como faço backup?
```bash
docker compose exec db pg_dump -U postgres macro_periods > backup.sql
```

### Esqueci a senha do admin
Está no arquivo `.env`:
- Email: `admin@example.com`
- Senha: `admin123`

## 🆘 Precisa de ajuda?

1. **Problema na instalação?** → [INSTALL_DOCKER.md](INSTALL_DOCKER.md)
2. **Erro ao rodar?** → [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. **Dúvida sobre funcionalidade?** → [README.md](README.md)
4. **Quer validar?** → [VALIDACAO.md](VALIDACAO.md)

## 🎉 Teste rápido (5 minutos)

Após instalar e rodar:

1. **Login** em http://localhost:3000
   - Email: admin@example.com
   - Senha: admin123

2. **Criar macro período**
   - Clique "Criar Macro Período"
   - Escolha unidade e médico
   - Defina período de 30 dias
   - Clique "Criar e Gerar Link"

3. **Abrir link do médico**
   - Copie o link gerado
   - Abra em aba anônima
   - Clique em dias do calendário
   - Selecione tipo e período
   - Confirme

4. **Ver resposta no admin**
   - Volte ao painel admin
   - Veja status "RESPONDIDO"
   - Clique "Ver Detalhes"
   - Confira seleções e audit trail

## 📦 Arquivos principais

```
Sistema-requisicao-slot/
├── COMECE_AQUI.md          ← Você está aqui!
├── INDICE.md               ← Navegação
├── RESUMO_ENTREGA.md       ← Visão geral
├── README.md               ← Documentação técnica
├── FLUXO_VISUAL.md         ← Diagramas
├── docker-compose.yml      ← Infraestrutura
├── setup.sh                ← Script de início
├── backend/                ← API Python
└── frontend/               ← Interface Next.js
```

## ✅ Checklist antes de começar

- [ ] Docker Desktop instalado
- [ ] WSL habilitado
- [ ] Navegador moderno (Chrome/Edge/Firefox)
- [ ] Portas 3000, 8000 e 5432 livres
- [ ] Leu [RESUMO_ENTREGA.md](RESUMO_ENTREGA.md)

## 🚀 Próximos passos

### Agora (MVP)
1. Instalar Docker
2. Executar sistema
3. Testar funcionalidades
4. Validar com checklist

### Curto prazo (melhorias)
- Adicionar testes automatizados
- Implementar notificações
- Melhorar UI/UX

### Médio prazo (produção)
- Integração com SISDADO
- Multi-tenancy
- Roles granulares

### Longo prazo (evolução)
- App mobile
- IA para sugestões
- Analytics avançado

## 💡 Dicas

- **Leia o RESUMO_ENTREGA.md primeiro** - Ele te dá contexto completo
- **Use o INDICE.md** - Navega facilmente por toda documentação
- **Consulte TROUBLESHOOTING.md** - 90% dos problemas estão lá
- **Veja FLUXO_VISUAL.md** - Entenda visualmente o sistema

## 🎯 Meta

**Objetivo do MVP**: Validar conceito e coletar feedback

**Resultado esperado**: Substituir WhatsApp por processo automatizado

**Próximo passo**: Feedback dos usuários reais (operação + médicos)

---

## 🌟 Comece agora!

```bash
# 1. Abra o terminal WSL
cd /mnt/c/Users/Tiago/desenvolvimento/Sistema-requisicao-slot

# 2. Leia a visão geral (opcional mas recomendado)
cat RESUMO_ENTREGA.md

# 3. Instale Docker (se ainda não tem)
# Acesse: https://www.docker.com/products/docker-desktop

# 4. Execute o sistema
./setup.sh

# 5. Acesse
# http://localhost:3000
```

---

**Desenvolvido**: Janeiro 2025
**Versão**: 1.0.0 - MVP
**Status**: ✅ Pronto para uso

**Boa sorte com o sistema! 🚀**

---

**Próximo arquivo sugerido**: [RESUMO_ENTREGA.md](RESUMO_ENTREGA.md)
