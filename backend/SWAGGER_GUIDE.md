# 🎨 Swagger UI - Teste Interativo da API

## ✅ Swagger UI Configurado!

Após iniciar o servidor (`npm run dev`), acesse:

**📍 http://localhost:3000/api-docs**

---

## 🚀 Como Usar

### 1️⃣ Registrar Usuário (Sem Autenticação)

1. Clique em **Autenticação** → **POST /api/auth/registrar**
2. Clique no botão **"Try it out"**
3. Preencha o JSON:
```json
{
  "email": "teste@example.com",
  "senha": "senha123",
  "nome": "João Silva"
}
```
4. Clique **"Execute"**
5. Copie o `token` da resposta

### 2️⃣ Fazer Login (Sem Autenticação)

1. Clique em **Autenticação** → **POST /api/auth/login**
2. Clique no botão **"Try it out"**
3. Preencha:
```json
{
  "email": "teste@example.com",
  "senha": "senha123"
}
```
4. Clique **"Execute"**
5. Copie o novo `token`

### 3️⃣ Autenticar no Swagger (IMPORTANTE!)

1. Clique no botão **"Authorize"** (cadeado 🔒) no topo da página
2. Cole seu token assim:
```
Bearer seu_token_aqui
```
Exemplo:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
3. Clique **"Authorize"** e depois **"Close"**

### 4️⃣ Agora Pode Testar Endpoints Protegidos

#### Criar Cliente
1. Clique em **Clientes** → **POST /api/clientes**
2. **"Try it out"**
3. Preencha:
```json
{
  "nome": "João Silva",
  "cpf": "12345678901",
  "email": "joao@example.com",
  "telefone": "(11) 98765-4321",
  "endereco": "Rua A, 123",
  "cidade": "São Paulo",
  "status": "ativo",
  "risco": "baixo"
}
```
4. **"Execute"**

#### Listar Clientes
1. Clique em **Clientes** → **GET /api/clientes**
2. **"Try it out"**
3. Deixe os parâmetros padrão
4. **"Execute"**

#### Criar Empréstimo (Gera Parcelas Automaticamente!)
1. Clique em **Empréstimos** → **POST /api/emprestimos**
2. **"Try it out"**
3. Preencha:
```json
{
  "cliente_id": 1,
  "data": "2026-03-21",
  "valor_emprestimo": 1000.00,
  "taxa_juros": 5,
  "quantidade_parcelas": 3
}
```
4. **"Execute"**
5. Observe que retorna o empréstimo E as 3 parcelas automaticamente criadas!

#### Registrar Pagamento de Parcela
1. Clique em **Parcelas** → **POST /api/parcelas/{parcelaId}/pagar**
2. **"Try it out"**
3. Em `parcelaId`: coloque `1` (da parcela anterior)
4. Preencha o body:
```json
{
  "valor_pago": 350.00,
  "metodo_pagamento": "dinheiro",
  "observacoes": "Pagamento em dia"
}
```
5. **"Execute"**

#### Ver Status de Pagamentos
1. Clique em **Parcelas** → **GET /api/parcelas/emprestimos/{emprestimoId}/status**
2. **"Try it out"**
3. Em `emprestimoId`: coloque `1` (do empréstimo anterior)
4. **"Execute"**
5. Verá um resumo com % pago, parcelas pagas, etc

---

## 📋 Fluxo Completo de Teste

```
1. POST /api/auth/registrar
   ↓ Copia token
   
2. POST /api/auth/login
   ↓ Copia novo token
   
3. Clica "Authorize" e cola token
   ↓
   
4. POST /api/clientes
   ↓ Cria um cliente, anota cliente_id
   
5. POST /api/emprestimos
   ↓ Usa cliente_id anterior, retorna emprestimo_id e parcelas
   
6. POST /api/parcelas/{parcelaId}/pagar
   ↓ Registra pagamento de uma parcela
   
7. GET /api/parcelas/emprestimos/{emprestimoId}/status
   ↓ Vê o resumo de pagamentos
```

---

## 🔑 Dicas Importantes

### ✅ Token JWT
- Token expira em **7 dias**
- Se expirar, faça login novamente
- Sempre incluir no header: `Authorization: Bearer {token}`

### ✅ Parcelas Automáticas
- Ao criar um empréstimo, as parcelas são criadas automaticamente!
- Cada parcela tem data de vencimento progressiva (mês a mês)
- Parcelas começam com status `pendente`

### ✅ Validações
- **CPF**: Deve ter 11 dígitos ou estar formatado como `XXX.XXX.XXX-XX`
- **Valor empréstimo**: Deve ser > 0
- **Taxa juros**: Deve ser >= 0
- **Parcelas**: Mínimo 1, máximo 6

### ✅ Status Enum
- **Cliente**: `ativo`, `inativo`, `suspendido`
- **Empréstimo**: `ativo`, `pago`, `cancelado`
- **Parcela**: `pendente`, `pago`, `atrasado`, `cancelada`
- **Risco**: `baixo`, `médio`, `alto`

---

## 🎯 Endpoints Disponíveis

### 🟦 Autenticação
- `POST /api/auth/registrar` - Sem token
- `POST /api/auth/login` - Sem token

### 🟩 Clientes (Requer Token)
- `GET /api/clientes` - Listar
- `POST /api/clientes` - Criar
- `GET /api/clientes/:id` - Obter um
- `PUT /api/clientes/:id` - Atualizar
- `DELETE /api/clientes/:id` - Deletar

### 🟨 Empréstimos (Requer Token)
- `GET /api/emprestimos` - Listar
- `POST /api/emprestimos` - Criar (gera parcelas!)
- `GET /api/emprestimos/:id` - Obter com parcelas
- `PUT /api/emprestimos/:id` - Atualizar
- `DELETE /api/emprestimos/:id` - Deletar

### 🟧 Parcelas (Requer Token)
- `GET /api/parcelas/emprestimos/:emprestimoId/parcelas` - Listar
- `POST /api/parcelas/:parcelaId/pagar` - Registrar pagamento
- `GET /api/parcelas/emprestimos/:emprestimoId/status` - Ver status

---

## 📸 Captura Rápida

1. **URL**: http://localhost:3000/api-docs
2. **Interface**: Swagger UI interativo e intuitivo
3. **Autenticado**: Clique no cadeado verde para autorizar
4. **Pronto**: Execute qualquer endpoint!

---

## ⚠️ Possíveis Erros

### "Token inválido"
- Você não autorizou? Clique no cadeado 🔒
- Token expirou? Faça login novamente

### "Cliente não encontrado"
- Você criou um cliente primeiro?
- Use o `cliente_id` correto

### "Parcela não encontrada"
- Crie um empréstimo primeiro (gera parcelas)
- Use o `parcelaId` correto

### "Conexão recusada"
- Servidor está rodando? `npm run dev`
- PostgreSQL está rodando?

---

## 🎉 Pronto!

Você tem acesso a uma **API REST completa e totalmente documentada**!

Todos os endpoints estão disponíveis para testar interativamente no Swagger UI.

**Acesse agora: http://localhost:3000/api-docs** ✨
