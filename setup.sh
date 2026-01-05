#!/bin/bash

echo "=========================================="
echo "Sistema de Gestão de Macro Períodos"
echo "Setup Script"
echo "=========================================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado!"
    echo ""
    echo "Por favor, instale o Docker primeiro:"
    echo "- Docker Desktop: https://www.docker.com/products/docker-desktop"
    echo "- Ou siga as instruções em INSTALL_DOCKER.md"
    echo ""
    exit 1
fi

echo "✓ Docker encontrado: $(docker --version)"

# Check Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado!"
    exit 1
fi

echo "✓ Docker Compose encontrado"
echo ""

# Create .env if not exists
if [ ! -f .env ]; then
    echo "Criando arquivo .env..."
    cp .env.example .env
    echo "✓ Arquivo .env criado"
else
    echo "✓ Arquivo .env já existe"
fi
echo ""

# Stop existing containers
echo "Parando containers existentes (se houver)..."
docker compose down 2>/dev/null
echo ""

# Build and start
echo "=========================================="
echo "Iniciando containers..."
echo "Isso pode levar alguns minutos na primeira vez"
echo "=========================================="
echo ""

docker compose up --build -d

# Wait for services
echo ""
echo "Aguardando serviços iniciarem..."
sleep 10

# Check status
echo ""
echo "=========================================="
echo "Status dos Containers"
echo "=========================================="
docker compose ps
echo ""

# Show logs
echo "=========================================="
echo "Últimas linhas dos logs (pressione Ctrl+C para sair):"
echo "=========================================="
echo ""
echo "Aguarde 30 segundos para que as migrations e seed sejam executados..."
sleep 5

# Final instructions
echo ""
echo "=========================================="
echo "✓ Sistema inicializado!"
echo "=========================================="
echo ""
echo "URLs de acesso:"
echo "- Frontend (Login): http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- API Docs: http://localhost:8000/docs"
echo ""
echo "Credenciais padrão:"
echo "- Email: admin@example.com"
echo "- Senha: admin123"
echo ""
echo "Para ver logs em tempo real:"
echo "  docker compose logs -f"
echo ""
echo "Para parar o sistema:"
echo "  docker compose down"
echo ""
