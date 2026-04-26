# 🎯 INTEGRAÇÃO FRONTEND-BACKEND - RESUMO EXECUTIVO

## O QUE FOI FEITO

### 📌 Camada de API Centralizada (`api.js`)
Nova arquivo que funciona como intermediária entre frontend e backend.

**Responsabilidades:**
- 🔐 Gerencia tokens JWT (armazena em localStorage)
- 📤 Injeta token automaticamente em cada requisição
- ⚠️ Detecta erros 401 (token expirado) e redireciona para login
- 📦 Oferece interface simples com métodos organizados por recurso

**Uso Simples:**
```javascript
// Registrar novo usuário
const usuario = await API.auth.registrar('email@test.com', 'senha123', 'João');

// Login
const resultado = await API.auth.login('email@test.com', 'senha123');
// resultado contém: { token, usuario }

// Criar cliente
const cliente = await API.clientes.criar({
  nome: 'João Silva',
  cpf: '123.456.789-00',
  telefone: '(11) 99999-9999',
  status: 'Ativo',
  risco: 'Baixo'
});

// Listar clientes
const resposta = await API.clientes.listar(1, 10);
// resposta contém: { dados: [...], total: N, pagina: 1 }

// Criar empréstimo
const emprestimo = await API.emprestimos.criar({
  cliente_id: 1,
  data_emprestimo: '2025-03-21',
  valor_principal: 1000,
  taxa_juros: 10,
  numero_parcelas: 4
});

// Listar empréstimos
const emprestimos = await API.emprestimos.listar(1, 999);
```

---

## 🔐 AUTENTICAÇÃO E SEGURANÇA

### Como Funciona:
1. **Login**: usuário coloca email/senha → `API.auth.login()` → backend valida
2. **Token Recebido**: backend retorna JWT token
3. **Armazenamento**: token guardado em `localStorage.sistema_chestao_token`
4. **Requisições**: toda requisição automaticamente adiciona header:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```
5. **Validação**: backend verifica token em todas rotas protegidas

### Logout:
- Botão "Sair" limpa token
- Redireciona para página de login
- Próxima requisição sem token leva ao login novamente

### Segurança por Camadas:
- ✅ Frontend: Verifica token em cada página
- ✅ Backend: Rejeita requisições sem JWT válido
- ✅ Database: Isola dados por usuário (usuario_id)

---

## 📄 PÁGINAS ATUALIZADAS

### 1. **index.html** (Login)
- Formulário conectado ao backend
- POST `/auth/login` via `API.auth.login()`
- Armazena token após sucesso
- Redireciona para `clientes.html`

### 2. **clientes.html** (Cadastro de Clientes)
- Verificação de autenticação no load
- Máscara de CPF e Telefone (preservada)
- Form → `API.clientes.criar()` → Backend
- Armazena cliente em localStorage
- Redireciona para `emprestimos.html`

### 3. **emprestimos.html** (Novo Empréstimo)
- Carrega lista de clientes do backend
- Select dinâmico: `<option value="1">João Silva</option>`
- Cálculo: Juros → Valor Total → Valor Parcela
- Form → `API.emprestimos.criar()` → Backend
- Backend cria parcelas automaticamente
- Redireciona para `emprestimos-lista.html`

### 4. **emprestimos-lista.html** (Ver Empréstimos)
- GET `/emprestimos` via `API.emprestimos.listar()`
- Renderiza tabela com:
  - Cliente (relacionamento)
  - Data, Valor, Juros, Parcelas
  - Valor Total, Valor da Parcela
- Botão Excluir: DELETE via `API.emprestimos.deletar(id)`

### 5. **scripts.js** (Lógica Geral)
- Login form handler
- Função `fazerLogout()` que limpa token
- Botão "Sair" injetado na topbar de todas páginas
- Background aleatorio em page de login

### 6. **api.js** (NOVO - Camada API)
- 148 linhas de código
- Centraliza todas requisições HTTP
- Gerencia autenticação
- Interface simples: `API.auth.*`, `API.clientes.*`, etc.

---

## 🧪 TESTE RÁPIDO (3 MINUTOS)

### Setup:
```bash
# Terminal 1: Backend
cd backend
npm run dev
# Esperado: "Servidor rodando na porta 3000"
```

### Testes:
1. **Abra**: `file://c:/Users/chest/OneDrive/...Sistema Chestão/emprestimos/index.html`
2. **Registre**: novo usuário (email: teste@test.com, senha: 123456)
3. **Login**: com credenciais registradas
4. **Crie Cliente**: João Silva, CPF 123.456.789-00, Status Ativo, Risco Baixo
5. **Crie Empréstimo**: Valor 1000, Juros 10%, Parcelas 4
6. **Veja Lista**: emprestimo deve aparecer na tabela
7. **Verifique Swagger**: http://localhost:3000/api-docs
   - Vá em GET /emprestimos
   - Vê vosso empréstimo criado? ✅

### Sintomas de Sucesso:
- ✅ Redirecionamento automático funciona
- ✅ Clientes aparecem no select
- ✅ Tabela mostra empréstimos criados
- ✅ API Swagger retorna seus dados
- ✅ Botão "Sair" funciona

---

## 🐛 TROUBLESHOOTING

| Erro | Solução |
|------|---------|
| "Erro: CORS policy..." | Backend não rodando. `npm run dev` na pasta backend |
| "Erro ao carregar clientes" | Verifique token. F12 → Console → veja erro exato |
| "401 Unauthorized" | Token expirado/inválido. Limpe localStorage: `localStorage.clear()` então login novamente |
| Clientes não aparecem | Createcliente antes de acessar emprestimos.html |
| Botão Sair não aparece | Verifique se página tem topbar com classe "topbar-content" |
| Números quebrados na tela | Problema de formatação. F12 → Console → veja erro |

---

## 📊 FLUXO DE DADOS

```
Frontend (HTML/JS)
    ↓
api.js (Centraliza requisições)
    ↓
HTTP (JSON + JWT Token)
    ↓
Backend (Node.js/Express)
    ↓
authMiddleware (Valida token)
    ↓
Controllers (Lógica de negócio)
    ↓
PostgreSQL (Banco de dados)

Resposta volta no mesmo caminho ↑ ↑ ↑
```

---

## 🔗 MAPEAMENTO DE ENDPOINTS

| Página | Ação | Método | Endpoint |
|--------|------|--------|----------|
| index.html | Login | POST | `/api/auth/login` |
| index.html | Registrar | POST | `/api/auth/registrar` |
| clientes.html | Criar | POST | `/api/clientes` |
| emprestimos.html | Listar clientes | GET | `/api/clientes?pagina=1&limite=999` |
| emprestimos.html | Criar | POST | `/api/emprestimos` |
| emprestimos-lista.html | Listar | GET | `/api/emprestimos?pagina=1&limite=999` |
| emprestimos-lista.html | Deletar | DELETE | `/api/emprestimos/:id` |

---

## 💾 ARMAZENAMENTO LOCAL

Token e usuário são guardados em **localStorage**:

```javascript
localStorage.sistema_chestao_token    // JWT token
localStorage.sistema_chestao_user     // { id, email, nome }
localStorage.clienteSelecionado       // Cliente criado (para emprestimos.html)
localStorage.emprestimoSelecionado    // Empréstimo criado (para lista)
```

**Para testar limpar tudo:**
```javascript
// No console do navegador (F12)
localStorage.clear()
// Então: refresh do página
```

---

## ✅ CHECKLIST - TUDO PRONTO?

- [x] Backend rodando (`npm run dev`)
- [x] Database PostgreSQL com schema criado
- [x] Arquivo `api.js` presente em `emprestimos/`
- [x] `index.html` com form de login
- [x] `clientes.html` com form de cliente
- [x] `emprestimos.html` com form de empréstimo
- [x] `emprestimos-lista.html` com tabela
- [x] `scripts.js` com logout
- [x] Swagger UI acessível em `localhost:3000/api-docs`

**Se todos marcados ✅ → Sistema Pronto para Usar! 🎉**

---

## 📝 PRÓXIMAS FEATURES (OPCIONAL)

- [ ] Página de Pagamentos (registrar pagamento de parcela)
- [ ] Editar Cliente/Empréstimo (UPDATE)
- [ ] Dashboard com relatórios
- [ ] Validação de email no frontend
- [ ] Loading spinners durante requisições
- [ ] Toast notifications (em vez de alerts)
- [ ] Dark mode

---

**Status Final: ✅ INTEGRAÇÃO COMPLETA E FUNCIONAL**

Todo o sistema frontend está comunicando com o backend via REST API + JWT!
