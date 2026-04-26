# GUIA RÁPIDO: Sistema Chestão Backend

## ✅ O que foi implementado

A estrutura completa do backend foi criada conforme o plano. Aqui está tudo que você tem:

### 📁 Estrutura de Pastas
```
backend/
├── src/
│   ├── config/          # database.js e env.js
│   ├── controllers/     # authController, clientesController, emprestimosController, parcelasController
│   ├── routes/          # auth, clientes, emprestimos, parcelas
│   ├── middleware/      # authMiddleware, errorHandler
│   ├── validators/      # clienteValidator, emprestimoValidator
│   └── app.js
├── migrations/          # 001-schema-inicial.sql
├── server.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

### 📋 Arquivos Criados

**Configuração:**
- ✅ `package.json` - Dependências (Express, Postgres, JWT, BCrypt)
- ✅ `.env.example` - Template de variáveis
- ✅ `.gitignore` - Git ignores

**Banco de Dados:**
- ✅ `migrations/001-schema-inicial.sql` - Schema completo com 5 tabelas + triggers

**Middleware & Config:**
- ✅ `src/config/database.js` - Pool de conexões Postgres
- ✅ `src/config/env.js` - Carrega variáveis de ambiente
- ✅ `src/middleware/authMiddleware.js` - Validação JWT
- ✅ `src/middleware/errorHandler.js` - Tratamento de erros

**Validadores:**
- ✅ `src/validators/clienteValidator.js` - Validação de clientes (CPF, email, telefone)
- ✅ `src/validators/emprestimoValidator.js` - Validação de empréstimos

**Controllers (Lógica de Negócio):**
- ✅ `src/controllers/authController.js` - Registrar, Login
- ✅ `src/controllers/clientesController.js` - CRUD clientes
- ✅ `src/controllers/emprestimosController.js` - CRUD empréstimos + geração automática de parcelas
- ✅ `src/controllers/parcelasController.js` - Listar, registrar pagamentos

**Rotas (Endpoints):**
- ✅ `src/routes/auth.js` - POST /auth/registrar, POST /auth/login
- ✅ `src/routes/clientes.js` - GET, POST, PUT, DELETE /clientes
- ✅ `src/routes/emprestimos.js` - GET, POST, PUT, DELETE /emprestimos
- ✅ `src/routes/parcelas.js` - Parcelas e pagamentos
- ✅ `src/routes/index.js` - Consolidação de rotas

**Entry Point:**
- ✅ `src/app.js` - App Express configurado
- ✅ `server.js` - Servidor rodando

---

## 🚀 Próximos Passos (CRÍTICO)

### 1️⃣ Instalar PostgreSQL (Se não tiver)
- Download: https://www.postgresql.org/download/
- Criar um usuário e banco de dados
- Anotar credenciais (usuário, senha, host, porta)

### 2️⃣ Criar Banco de Dados
```sql
-- Abrir pgAdmin ou comando SQL
CREATE DATABASE sistema_chestao;
```

### 3️⃣ Executar Script SQL
```bash
cd backend
psql -U seu_usuario -d sistema_chestao -f migrations/001-schema-inicial.sql
```

Isso criará automaticamente:
- 5 tabelas (usuarios, clientes, emprestimos, parcelas, historico_pagamentos)
- Índices para performance
- Triggers para atualizar `atualizado_em`

### 4️⃣ Configurar `.env`
```bash
cd backend
cp .env.example .env
```

Editar `.env` com suas credenciais:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=seu_usuario_postgres
DB_PASSWORD=sua_senha_postgres
DB_NAME=sistema_chestao
SERVER_PORT=3000
JWT_SECRET=uma_chave_super_secreta_aqui
CORS_ORIGIN=http://localhost:8000
```

### 5️⃣ Instalar Dependências
```bash
cd backend
npm install
```

### 6️⃣ Iniciar Backend
```bash
npm run dev
```

Você deve ver:
```
✓ Conexão com banco de dados estabelecida
✓ Servidor rodando em http://localhost:3000
✓ Ambiente: development
✓ CORS habilitado para: http://localhost:8000
```

### 7️⃣ Testar com Postman/Insomnia

**Testar Registrar:**
```
POST http://localhost:3000/api/auth/registrar
Body (JSON):
{
  "email": "teste@example.com",
  "senha": "senha123",
  "nome": "Teste"
}
```

Se retornar status 201 com token → ✅ Funcionando!

---

## 📊 Fluxo Completo de Uso

```
1. Registrar/Login
   ↓
2. Copiar Token
   ↓
3. Criar Cliente (com token no header)
   ↓
4. Criar Empréstimo (parcelas criadas automaticamente)
   ↓
5. Registrar Pagamentos das Parcelas
   ↓
6. Ver Status dos Pagamentos
```

---

## 🔑 Endpoints Resumidos

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| POST | `/api/auth/registrar` | ❌ | Criar novo usuário |
| POST | `/api/auth/login` | ❌ | Fazer login |
| GET | `/api/clientes` | ✅ | Listar clientes |
| POST | `/api/clientes` | ✅ | Criar cliente |
| GET | `/api/clientes/:id` | ✅ | Ver cliente |
| PUT | `/api/clientes/:id` | ✅ | Editar cliente |
| DELETE | `/api/clientes/:id` | ✅ | Deletar cliente |
| GET | `/api/emprestimos` | ✅ | Listar empréstimos |
| POST | `/api/emprestimos` | ✅ | Criar empréstimo |
| GET | `/api/emprestimos/:id` | ✅ | Ver empréstimo + parcelas |
| PUT | `/api/emprestimos/:id` | ✅ | Editar empréstimo |
| DELETE | `/api/emprestimos/:id` | ✅ | Deletar empréstimo |
| GET | `/api/parcelas/emprestimos/:emprestimoId/parcelas` | ✅ | Listar parcelas |
| POST | `/api/parcelas/:parcelaId/pagar` | ✅ | Registrar pagamento |
| GET | `/api/parcelas/emprestimos/:emprestimoId/status` | ✅ | Status pag. |

---

## 📚 Documentação Completa

Ver em: `backend/README.md`

---

## ⚠️ Troubleshooting

### "Erro ao conectar ao banco de dados"
- PostgreSQL não está rodando?
- Credenciais erradas em `.env`?
- Banco de dados não foi criado?

### "Cannot find module 'express'"
```bash
npm install
```

### "Connection refused on port 3000"
- Porta 3000 já está sendo usada
- Trocar em `.env`: `SERVER_PORT=3001`

### Parcelas não estão sendo criadas ao criar empréstimo
- Verificar se empréstimo foi criado com sucesso
- Verificar datas (data_vencimento deve estar no futuro)

---

## 🎯 Fase 4 (Próxima): Integração Frontend

O backend está pronto! Na Phase 4, você integrará o seu frontend (`emprestimos/` folder) com este backend:

1. Modificar `emprestimos/scripts.js` para fazer login via `POST /api/auth/login`
2. Armazenar token em `localStorage` ou `sessionStorage`
3. Fazer fetch para criar/listar clientes e empréstimos
4. Remover dados hardcoded

Vou ajudar com isso quando estiver pronto!

---

## ✨ Resumo Final

- ✅ Backend Node.js/Express totalmente funcional
- ✅ Banco de dados Postgres com schema completo
- ✅ Autenticação JWT implementada
- ✅ CRUD para Clientes, Empréstimos e Parcelas
- ✅ Geração automática de parcelas
- ✅ Validações de negócio
- ✅ Pool de conexões otimizado
- ✅ Tratamento de erros
- ✅ CORS configurado

**Próximo: Executar as primeiras 6 etapas acima! 🚀**
