# Instalação do Docker no WSL

## Opção 1: Docker Desktop (Recomendado para WSL)

1. **Baixe e instale o Docker Desktop para Windows**:
   - Acesse: https://www.docker.com/products/docker-desktop
   - Instale o Docker Desktop
   - Durante a instalação, marque "Use WSL 2 instead of Hyper-V"

2. **Configure o Docker Desktop**:
   - Abra Docker Desktop
   - Vá em Settings → Resources → WSL Integration
   - Habilite integração com sua distro Ubuntu

3. **Verifique a instalação no WSL**:
   ```bash
   docker --version
   docker compose version
   ```

## Opção 2: Docker Engine direto no WSL

Se preferir instalar apenas o Docker Engine no WSL (sem Docker Desktop):

```bash
# Atualizar pacotes
sudo apt-get update

# Instalar dependências
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar seu usuário ao grupo docker
sudo usermod -aG docker $USER

# Reiniciar serviço
sudo service docker start

# Verificar
docker --version
docker compose version
```

## Após Instalação

Execute no terminal WSL:
```bash
cd /mnt/c/Users/Tiago/desenvolvimento/Sistema-requisicao-slot
docker compose up --build
```

Aguarde alguns minutos para:
- Download das imagens (Python, Node, PostgreSQL)
- Build dos containers
- Execução das migrations
- Seed do banco de dados

## URLs de Acesso

Após inicialização:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Documentação da API: http://localhost:8000/docs

## Credenciais Padrão

- **Email**: admin@example.com
- **Senha**: admin123
