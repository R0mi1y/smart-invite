#!/bin/bash

echo "🔧 Resolvendo problema do Docker build..."

# Navegar para o diretório admin
cd /home/romily/admin || exit 1

# Função para executar comando com sudo
run_with_sudo() {
    echo "Executando: $1"
    sudo $1
}

# 1. Parar o container se estiver rodando
echo "📦 Parando container smart-invite..."
run_with_sudo "docker compose stop smart-invite"

# 2. Remover container e imagem
echo "🗑️  Removendo container e imagem existentes..."
run_with_sudo "docker compose rm -f smart-invite"
run_with_sudo "docker rmi smart-invite-smart-invite:latest 2>/dev/null || true"

# 3. Limpar cache do Docker
echo "🧹 Limpando cache do Docker..."
run_with_sudo "docker system prune -f"
run_with_sudo "docker builder prune -f"

# 4. Verificar espaço em disco
echo "💾 Verificando espaço em disco..."
df -h /var/lib/docker

# 5. Tentar build com menos paralelismo
echo "🏗️  Iniciando build com configurações otimizadas..."
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

# Build com menos paralelismo para evitar problemas de I/O
run_with_sudo "docker compose build --no-cache --progress=plain smart-invite"

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    
    # 6. Iniciar o container
    echo "🚀 Iniciando container..."
    run_with_sudo "docker compose up -d smart-invite"
    
    echo "🎉 Smart-invite reiniciado com sucesso!"
    run_with_sudo "docker compose ps smart-invite"
else
    echo "❌ Erro no build. Tentando abordagem alternativa..."
    
    # Tentar com Docker padrão (sem BuildKit)
    export DOCKER_BUILDKIT=0
    echo "🔄 Tentando sem BuildKit..."
    run_with_sudo "docker compose build --no-cache smart-invite"
    
    if [ $? -eq 0 ]; then
        echo "✅ Build alternativo bem-sucedido!"
        run_with_sudo "docker compose up -d smart-invite"
    else
        echo "❌ Build falhou mesmo com abordagem alternativa."
        echo "💡 Sugestões:"
        echo "   1. Reiniciar Docker daemon: sudo systemctl restart docker"
        echo "   2. Verificar logs: sudo journalctl -u docker.service --no-pager --lines 50"
        echo "   3. Verificar espaço em disco: df -h"
        exit 1
    fi
fi
