# Plan: Implementar Backend Node.js + Postgres para Sistema Chestão

## TL;DR
Criar um backend Node.js com Express que se conecta a um banco de dados Postgres para persistir dados do sistema de gestão de empréstimos. O banco terá 5 tabelas principais (usuarios, clientes, emprestimos, parcelas, historico_pagamentos) com relacionamentos 1:N entre clientes/empréstimos e empréstimos/parcelas. O backend será em pasta separada com autenticação JWT, validações e endpoints RESTful para integração com o frontend.

---

## Fase 1: Modelagem de Banco de Dados (Postgres)

### Tabelas:

**1. usuarios**
- id (SERIAL PRIMARY KEY)
- email (VARCHAR UNIQUE NOT NULL)
- senha_hash (VARCHAR NOT NULL)
- nome (VARCHAR)
- ativo (BOOLEAN DEFAULT true)
- criado_em (TIMESTAMP DEFAULT NOW())
- atualizado_em (TIMESTAMP DEFAULT NOW())

**2. clientes**
- id (SERIAL PRIMARY KEY)
- usuario_id (FOREIGN KEY → usuarios.id)
- nome (VARCHAR NOT NULL)
- cpf (VARCHAR UNIQUE NOT NULL) - armazenar sem formatação
- email (VARCHAR)
- telefone (VARCHAR)
- endereco (VARCHAR)
- cidade (VARCHAR)
- status (VARCHAR DEFAULT 'ativo') - valores: 'ativo', 'inativo', 'suspendido'
- risco (VARCHAR DEFAULT 'baixo') - valores: 'baixo', 'médio', 'alto'
- observacoes (TEXT)
- criado_em (TIMESTAMP DEFAULT NOW())
- atualizado_em (TIMESTAMP DEFAULT NOW())

**3. emprestimos**
- id (SERIAL PRIMARY KEY)
- usuario_id (FOREIGN KEY → usuarios.id)
- cliente_id (FOREIGN KEY → clientes.id)
- data (DATE NOT NULL)
- valor_emprestimo (DECIMAL(10,2) NOT NULL)
- taxa_juros (DECIMAL(5,2) NOT NULL) - percentual
- quantidade_parcelas (INT NOT NULL)
- valor_total (DECIMAL(10,2) NOT NULL) - calculado
- status (VARCHAR DEFAULT 'ativo') - valores: 'ativo', 'pago', 'cancelado'
- criado_em (TIMESTAMP DEFAULT NOW())
- atualizado_em (TIMESTAMP DEFAULT NOW())

**4. parcelas**
- id (SERIAL PRIMARY KEY)
- emprestimo_id (FOREIGN KEY → emprestimos.id)
- numero_parcela (INT NOT NULL)
- valor_parcela (DECIMAL(10,2) NOT NULL)
- data_vencimento (DATE NOT NULL)
- data_pagamento (DATE NULL)
- status (VARCHAR DEFAULT 'pendente') - valores: 'pendente', 'pago', 'atrasado', 'cancelada'
- valor_pago (DECIMAL(10,2) DEFAULT 0)
- criado_em (TIMESTAMP DEFAULT NOW())
- atualizado_em (TIMESTAMP DEFAULT NOW())
- UNIQUE(emprestimo_id, numero_parcela)

**5. historico_pagamentos** (opcional, comentado no plan base, mas estruturado para futuro)
- id (SERIAL PRIMARY KEY)
- parcela_id (FOREIGN KEY → parcelas.id)
- valor_pago (DECIMAL(10,2))
- data_pagamento (TIMESTAMP)
- metodo_pagamento (VARCHAR)
- observacoes (TEXT)
- criado_em (TIMESTAMP DEFAULT NOW())

### Índices:
- usuario_id em clientes, emprestimos (para queries rápidas por usuário)
- cliente_id em emprestimos
- emprestimo_id em parcelas
- cpf em clientes (busca por CPF)

---

## Fase 2: Estrutura do Projeto Backend (Node.js + Express)

### Estrutura de Pastas:
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Conexão Postgres
│   │   └── env.js               # Variáveis de ambiente
│   ├── controllers/
│   │   ├── authController.js    # Login, registro
│   │   ├── clientesController.js
│   │   ├── emprestimosController.js
│   │   └── parcelasController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── clientes.js
│   │   ├── emprestimos.js
│   │   └── index.js
│   ├── middleware/
│   │   ├── authMiddleware.js    # Validação JWT
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Usuario.js
│   │   ├── Cliente.js
│   │   ├── Emprestimo.js
│   │   └── Parcela.js
│   ├── validators/
│   │   ├── clienteValidator.js
│   │   └── emprestimoValidator.js
│   └── app.js
├── migrations/                    # Scripts SQL iniciais
│   └── 001-schema-inicial.sql
├── .env                           # Variáveis de ambiente
├── package.json
└── server.js                      # Entry point

```

### Technologies:
- **Express.js** - Framework HTTP
- **pg** (node-postgres) - Driver Postgres
- **dotenv** - Variáveis de ambiente
- **bcrypt** - Hash de senhas
- **jsonwebtoken** - Autenticação JWT
- **cors** - Suporte a CORS
- **joi** - Validação de schema

---

## Fase 3: Implementação Backend (Passo a Passo)

### 3.1 Configuração Inicial (Fase Preparatória)
1. Criar pasta `backend` na raiz do projeto
2. Inicializar Node.js: `npm init -y`
3. Instalar dependências: `express pg dotenv bcrypt jsonwebtoken cors joi`
4. Criar arquivo `.env` com variáveis de conexão Postgres
5. Criar arquivo `src/config/database.js` com pool de conexões

### 3.2 Schema do Banco de Dados
1. Criar arquivo `migrations/001-schema-inicial.sql` com DDL das 5 tabelas
2. Executar script no Postgres
3. Criar triggers para atualizar `atualizado_em` automaticamente

### 3.3 Implementar Autenticação (Bloqueia tudo que vem depois)
- **Arquivo**: `src/controllers/authController.js`
  - `registrar(email, senha, nome)` → hash senha, criar usuário
  - `login(email, senha)` → validar, gerar JWT token
- **Arquivo**: `src/middleware/authMiddleware.js`
  - Validar token JWT em todas as rotas protegidas
- **Arquivo**: `src/routes/auth.js`
  - POST `/auth/registrar`
  - POST `/auth/login`

### 3.4 CRUD de Clientes (*depende de 3.3*)
- **Arquivo**: `src/controllers/clientesController.js`
  - `criarCliente(usuarioId, dadosCliente)`
  - `listarClientes(usuarioId)` → paginated
  - `obterCliente(id, usuarioId)`
  - `atualizarCliente(id, usuarioId, dadosCliente)`
  - `deletarCliente(id, usuarioId)` → soft delete ou validar se tem empréstimos
- **Arquivo**: `src/validators/clienteValidator.js`
  - Validar CPF (formato)
  - Validar email
  - Validar telefone (formato)
- **Arquivo**: `src/routes/clientes.js`
  - GET `/clientes`
  - POST `/clientes`
  - GET `/clientes/:id`
  - PUT `/clientes/:id`
  - DELETE `/clientes/:id`

### 3.5 CRUD de Empréstimos (*depende de 3.4*)
- **Arquivo**: `src/controllers/emprestimosController.js`
  - `criarEmprestimo(usuarioId, dadosEmprestimo)` → criar empréstimo + gerar parcelas automaticamente
  - `listarEmprestimos(usuarioId)` → paginated, com filtros por status/cliente
  - `obterEmprestimo(id, usuarioId)` → incluir parcelas
  - `atualizarEmprestimo(id, usuarioId, dados)` → validar se pode atualizar (status)
  - `deletarEmprestimo(id, usuarioId)` → soft delete
- **Arquivo**: `src/validators/emprestimoValidator.js`
  - Validar valor > 0
  - Validar taxa juros >= 0
  - Validar parcelas > 0 e <= 6
  - Validar cliente existe
- **Arquivo**: `src/routes/emprestimos.js`
  - GET `/emprestimos`
  - POST `/emprestimos` → cria automático as parcelas
  - GET `/emprestimos/:id`
  - PUT `/emprestimos/:id`
  - DELETE `/emprestimos/:id`

### 3.6 CRUD de Parcelas e Pagamentos (*depende de 3.5*)
- **Arquivo**: `src/controllers/parcelasController.js`
  - `listarParcelasPorEmprestimo(emprestimoId, usuarioId)`
  - `registrarPagamentoParcela(parcelaId, usuarioId, valores)` → atualiza status
  - `obterStatusPagamentos(emprestimoId, usuarioId)` → resumo
- **Arquivo**: `src/routes/parcelas.js`
  - GET `/emprestimos/:emprestimoId/parcelas`
  - POST `/parcelas/:id/pagar` → registrar pagamento
  - GET `/emprestimos/:emprestimoId/status-pagamento`

### 3.7 Integração de Rotas
- Criar `src/routes/index.js` que consolida todas as rotas
- Criar `src/app.js` que monta Express com middleware e rotas
- Criar `server.js` como entry point

### 3.8 Testes e Validação
1. Testar conexão com Postgres
2. Testar endpoints com Postman/Insomnia
3. Verificar autenticação JWT
4. Verificar validações

---

## Fase 4: Integração Frontend ↔ Backend

### 4.1 Atualizar Frontend
- Modificar `scripts.js` para fazer login via POST `/auth/login`
- Armazenar JWT token em sessionStorage/localStorage
- Interceptar chamadas para enviar token em Authorization header
- Adicionar chamadas AJAX/Fetch para CRUD de clientes e empréstimos
- Remover hardcoding de dados (formário.value → fetch para backend)

### 4.2 CORS e Deploy Local
- Ativar CORS no Express para `http://localhost:8000` (frontend)
- Backend roda em porta 3000 ou 5000
- Frontend roda em porta 8000 (via Live Server ou similar)

---

## Verificação

1. **Banco de Dados**: Executar script SQL, validar tabelas e índices
2. **Autenticação**: Testar login/registro, verificar JWT
3. **CRUD Clientes**: POST novo cliente → GET listar → atualizar → deletar
4. **CRUD Empréstimos**: Criar empréstimo → validar parcelas criadas automaticamente → atualizar status
5. **Pagamentos**: Registrar pagamento de parcela → verificar status atualizado
6. **Errors**: Testar validações (CPF duplicado, valor negativo, etc)
7. **Integração**: Frontend consegue fazer login e listar clientes do backend

---

## Decisões & Escopo

### Incluído:
- ✅ Banco de dados Postgres com 5 tabelas principais
- ✅ Backend Express.js com autenticação JWT
- ✅ CRUD completo (clientes, empréstimos, parcelas)
- ✅ Geração automática de parcelas ao criar empréstimo
- ✅ Validações de negócio (CPF único, máximo 6 parcelas, etc)
- ✅ Soft delete para dados

### Excluído (Phase 2+):
- ❌ Histórico de alterações (pode ser adicionado depois)
- ❌ Geração de relatórios em PDF
- ❌ Notificações de parcelas atrasadas
- ❌ API de busca avançada com filtros complexos
- ❌ Deploy em produção (servidor, SSL, etc)

### Decisões Técnicas:
- **JWT vs Sessions**: JWT para stateless (melhor escalabilidade)
- **Pool de Conexões**: Usar `pg.Pool` para reutilizar conexões
- **Soft Delete**: Marcar após status='cancelado' em vez de deletar (auditoria)
- **Validação**: Fazer no backend (nunca confiar no cliente)

---

## Próximos Passos (Após Aprovação)

1. Dar go/no-go para Fase 1 (scripts SQL)
2. Depois: Fase 2-3 (backend setup + CRUD)
3. Depois: Fase 4 (integração frontend)
4. Testes integrados e deploy local
