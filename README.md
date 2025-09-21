# Smart Invite - Sistema de Convites

Sistema completo para criação e gerenciamento de convites personalizados usando Next.js e MySQL.

## 🚀 Funcionalidades

- ✅ Criação de eventos com informações detalhadas
- ✅ Geração de convites personalizados com tokens únicos
- ✅ Carrossel de fotos nos convites
- ✅ Confirmação de presença com contagem de pessoas
- ✅ Banco de dados MySQL integrado
- ✅ Interface responsiva e moderna
- ✅ Popup para compartilhamento de links

## 🛠️ Tecnologias

- **Next.js 14** - Framework React
- **React 18** - Biblioteca de interface
- **MySQL** - Banco de dados
- **Docker** - Containerização
- **Traefik** - Proxy reverso

## 📦 Instalação e Deploy

### Com Docker (Recomendado)

1. **Build e start:**
   ```bash
   cd /home/romily/admin
   docker-compose up -d --build smart-invite
   ```

2. **Verificar logs:**
   ```bash
   docker-compose logs -f smart-invite
   ```

### Desenvolvimento Local

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   export DB_HOST=localhost
   export DB_USER=user
   export DB_PASSWORD=pass123
   export DB_NAME=convites_db
   ```

3. **Executar:**
   ```bash
   npm run dev
   ```

## 🌐 Acesso

- **Aplicação:** https://romilydev.online/convites
- **Convites individuais:** https://romilydev.online/convites/convite/[token]

## 🗄️ Estrutura do Banco

### Tabela `events`
- `id` - ID único do evento
- `name` - Nome do evento
- `description` - Descrição
- `message` - Mensagem personalizada
- `photos` - JSON com URLs das fotos
- `location` - Local do evento
- `date` - Data/hora do evento
- `created_at` - Data de criação

### Tabela `guests`
- `id` - ID único do convidado
- `event_id` - ID do evento (FK)
- `name` - Nome do convidado
- `token` - Token único para acesso
- `confirmed` - Status de confirmação
- `num_people` - Número de pessoas
- `created_at` - Data de criação

## 📱 Como Usar

1. **Criar Evento:** Clique em "Criar Novo Evento" e preencha as informações
2. **Adicionar Fotos:** Use URLs de imagens para criar um carrossel
3. **Gerar Convite:** Selecione um evento e digite o nome do convidado
4. **Compartilhar:** Copie o link gerado e envie para o convidado
5. **Confirmar Presença:** O convidado acessa o link e confirma a participação

## 🔧 Configuração Docker

O serviço está configurado no docker-compose.yml com:
- Conexão com MySQL existente
- Variáveis de ambiente configuradas
- Traefik para SSL e roteamento
- Porta interna 3001

## 🏗️ Estrutura do Projeto

```
smart-invite/
├── src/
│   ├── pages/
│   │   ├── api/
│   │   │   ├── events.js
│   │   │   ├── guests.js
│   │   │   └── invite/[token].js
│   │   ├── convite/[token].js
│   │   └── index.js
│   └── styles/
│       └── globals.css
├── lib/
│   └── database.js
├── Dockerfile
├── next.config.js
├── package.json
└── README.md
```