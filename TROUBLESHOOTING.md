# Troubleshooting

## Problemas Comuns e Soluções

### 1. Docker não encontrado

**Erro**: `docker: command not found`

**Solução**:
- Instale o Docker Desktop: https://www.docker.com/products/docker-desktop
- Ou siga as instruções em `INSTALL_DOCKER.md`
- Após instalar, reinicie o terminal WSL

### 2. Portas já em uso

**Erro**: `bind: address already in use`

**Solução**:
```bash
# Ver processos usando portas
sudo lsof -i :3000
sudo lsof -i :8000
sudo lsof -i :5432

# Ou parar containers existentes
docker compose down

# Ou no Windows, identificar processos
netstat -ano | findstr :3000
```

### 3. Migrations falham

**Erro**: `alembic.util.exc.CommandError`

**Solução**:
```bash
# Parar containers
docker compose down

# Remover volumes (CUIDADO: apaga dados)
docker compose down -v

# Rebuild
docker compose up --build
```

### 4. Frontend não conecta ao backend

**Erro**: `Network Error` ou `CORS error`

**Verificações**:
1. Backend está rodando?
   ```bash
   curl http://localhost:8000/health
   ```

2. Variável de ambiente correta?
   ```bash
   # No frontend/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. CORS configurado?
   - Verifique `backend/app/main.py`
   - Em produção, especifique origins exatas

### 5. Login falha

**Erro**: `Invalid credentials`

**Verificações**:
1. Use credenciais corretas:
   - Email: admin@example.com
   - Senha: admin123

2. Verifique `.env`:
   ```bash
   cat .env | grep ADMIN
   ```

3. Se alterou `.env`, rebuild:
   ```bash
   docker compose down
   docker compose up --build
   ```

### 6. Seed não executou

**Sintoma**: Sem unidades ou médicos no sistema

**Solução**:
```bash
# Executar seed manualmente
docker compose exec backend python seed_data.py

# Verificar dados
docker compose exec db psql -U postgres -d macro_periods -c "SELECT COUNT(*) FROM units;"
docker compose exec db psql -U postgres -d macro_periods -c "SELECT COUNT(*) FROM doctors;"
```

### 7. Calendário não funciona

**Sintomas**:
- Dias não clicáveis
- Modal não abre
- Erro no console

**Verificações**:
1. Período macro está correto (datas futuras)?
2. Status permite edição (AGUARDANDO ou EDICAO_LIBERADA)?
3. Console do navegador mostra erros?

### 8. Token inválido ou expirado

**Erro**: Link público retorna 404

**Causas**:
1. Token foi deletado do banco
2. Banco foi resetado
3. URL incompleta/incorreta

**Solução**:
- Gerar novo macro período
- Verificar URL completa: `http://localhost:3000/p/{TOKEN_AQUI}`

### 9. Export CSV falha

**Erro**: Download não inicia ou arquivo vazio

**Verificações**:
1. Backend está acessível?
2. Macro período tem seleções?
3. Token de autenticação válido?

**Teste manual**:
```bash
# Com token JWT
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8000/macro-periods/1/export.csv \
     --output test.csv
```

### 10. Containers não param

**Problema**: `docker compose down` não funciona

**Solução forçada**:
```bash
# Listar containers
docker ps -a

# Parar todos
docker stop $(docker ps -aq)

# Remover todos
docker rm $(docker ps -aq)

# Ou forçar
docker compose down --remove-orphans
```

## Logs e Debugging

### Ver logs de todos os serviços
```bash
docker compose logs
```

### Ver logs de um serviço específico
```bash
docker compose logs backend
docker compose logs frontend
docker compose logs db
```

### Seguir logs em tempo real
```bash
docker compose logs -f backend
```

### Ver últimas N linhas
```bash
docker compose logs --tail=50 backend
```

### Entrar no container
```bash
# Backend
docker compose exec backend bash

# Frontend
docker compose exec frontend sh

# Database
docker compose exec db psql -U postgres -d macro_periods
```

### Verificar variáveis de ambiente
```bash
docker compose exec backend env | grep DATABASE
docker compose exec frontend env | grep NEXT_PUBLIC
```

## Resetar Tudo

Para começar do zero:

```bash
# Parar tudo
docker compose down

# Remover volumes (apaga banco de dados!)
docker compose down -v

# Remover imagens
docker compose down --rmi all

# Rebuild completo
docker compose up --build
```

## Performance

### Build muito lento

**Causas**:
- Primeira vez (download de imagens)
- Conexão lenta
- Antivírus interferindo (Windows)

**Soluções**:
- Aguardar (5-10 minutos primeira vez)
- Usar cache de Docker
- Desabilitar temporariamente antivírus

### Frontend lento para atualizar

**Causa**: Hot reload do Next.js

**Solução**:
- Normal em development
- Em produção, usar build otimizado

## Problemas Específicos do WSL

### 1. Permissões de arquivo

**Erro**: `Permission denied`

**Solução**:
```bash
# Corrigir permissões
chmod -R 755 backend/
chmod -R 755 frontend/
```

### 2. Line endings (CRLF vs LF)

**Erro**: Scripts não executam

**Solução**:
```bash
# Converter para LF
dos2unix setup.sh
# Ou
sed -i 's/\r$//' setup.sh
```

### 3. Docker Desktop não integrado

**Sintoma**: Docker funciona no Windows mas não no WSL

**Solução**:
- Abra Docker Desktop → Settings → Resources → WSL Integration
- Habilite sua distro Ubuntu
- Reinicie WSL

## Verificação de Saúde

Execute estes comandos para verificar o estado do sistema:

```bash
# 1. Containers rodando?
docker compose ps

# 2. Backend saudável?
curl http://localhost:8000/health

# 3. Frontend acessível?
curl http://localhost:3000

# 4. Banco de dados conectando?
docker compose exec db psql -U postgres -d macro_periods -c "SELECT 1;"

# 5. Migrations aplicadas?
docker compose exec backend alembic current

# 6. Dados seed?
docker compose exec db psql -U postgres -d macro_periods -c "SELECT COUNT(*) FROM units; SELECT COUNT(*) FROM doctors;"
```

**Resultado esperado**:
- 3 containers rodando (db, backend, frontend)
- Backend retorna `{"status": "healthy"}`
- Frontend retorna HTML
- Banco retorna "1"
- Alembic mostra revisão "001"
- 5 units, 30 doctors

## Suporte Adicional

Se nenhuma solução acima resolver:

1. **Coleta de informações**:
   ```bash
   # Versões
   docker --version
   docker compose version
   node --version
   python --version

   # Logs completos
   docker compose logs > logs.txt

   # Status
   docker compose ps
   ```

2. **Verificar documentação**:
   - README.md
   - Código-fonte comentado
   - API docs em http://localhost:8000/docs

3. **Rebuild limpo**:
   ```bash
   docker compose down -v --rmi all
   docker compose up --build
   ```

## Checklist de Problemas Resolvidos

- [ ] Docker instalado e funcionando
- [ ] Containers iniciam sem erros
- [ ] Migrations aplicadas com sucesso
- [ ] Seed executado (5 units, 30 doctors)
- [ ] Backend responde em http://localhost:8000/health
- [ ] Frontend carrega em http://localhost:3000
- [ ] Login funciona
- [ ] Criação de macro período funciona
- [ ] Link público funciona
- [ ] Calendário interativo funciona
- [ ] Confirmação de resposta funciona
- [ ] Audit trail registra eventos
- [ ] Export CSV funciona

---

**Última atualização**: Janeiro 2025
