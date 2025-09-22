# Correção do Erro Docker Build

## Problema Identificado
Erro: `failed to execute bake: read |0: file already closed`

Este erro geralmente ocorre por:
- Problemas de I/O durante o build
- Cache corrompido do Docker
- Recursos insuficientes durante o build
- Conflitos de processos Docker

## Soluções Implementadas

### 1. **Script Automatizado**
Criado script `scripts/docker-rebuild.sh` que:
- Para e remove containers/imagens existentes
- Limpa cache do Docker
- Faz rebuild otimizado
- Tenta diferentes abordagens se necessário

### 2. **Dockerfile Otimizado** 
- Mudança para Node.js 20 (mais estável)
- Uso de `npm ci` para instalação determinística
- Melhor layering para cache
- Uso de `dumb-init` para gerenciamento de sinais
- Configurações npm otimizadas

### 3. **Arquivo .dockerignore**
- Exclui arquivos desnecessários do contexto
- Reduz tamanho do build
- Evita conflitos

## Como Usar

### Opção 1: Script Automatizado (Recomendado)
```bash
cd /home/romily/repositories/smart-invite
./scripts/docker-rebuild.sh
```

### Opção 2: Manual
```bash
cd /home/romily/admin

# Parar e limpar
sudo docker compose stop smart-invite
sudo docker compose rm -f smart-invite
sudo docker rmi smart-invite-smart-invite:latest
sudo docker system prune -f
sudo docker builder prune -f

# Rebuild
sudo docker compose build --no-cache smart-invite
sudo docker compose up -d smart-invite
```

### Opção 3: Se Ainda Falhar
```bash
# Reiniciar Docker daemon
sudo systemctl restart docker

# Verificar logs do Docker
sudo journalctl -u docker.service --no-pager --lines 50

# Verificar espaço em disco
df -h /var/lib/docker
```

## Verificação Final
```bash
cd /home/romily/admin
sudo docker compose ps
sudo docker compose logs smart-invite
```

## Melhorias Implementadas para o Futuro
- Tratamento de erros JavaScript mais robusto
- Verificações de DOM seguras
- Melhor hidratação Next.js
- Sistema de logs para debugging
