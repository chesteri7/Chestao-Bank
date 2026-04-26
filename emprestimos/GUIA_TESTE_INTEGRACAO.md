# 🧪 Guia de Teste - Integração Frontend-Backend

## 📋 Verificação Pré-Teste

### 1. Confirmar que o Backend está Rodando
```bash
# No terminal do backend
npm run dev
# Deve mostrar: "Servidor rodando na porta 3000"
```

### 2. Testar API Direto (Swagger UI)
- Abra: `http://localhost:3000/api-docs`
- Verifique se todos os endpoints estão listados

---

## 🧪 Teste 1: Autenticação

### Passo 1: Acessar Login
1. Abra `file:///c:/Users/chest/OneDrive/Documentos/Projetos%20de%20Programa%C3%A7%C3%A3o/Sistema%20Chest%C3%A3o/emprestimos/index.html`
2. Você deve estar na página de login

### Passo 2: Registrar Novo Usuário
1. Preencha:
   - Email: `teste@example.com`
   - Senha: `senha123`
2. Clique em "Registrar"
3. **Esperado**: Deve redirecionar para `clientes.html` automaticamente

### Passo 3: Logout e Login
1. Recarregue a página (F5)
2. Se foi redirecionado de volta ao login, o logout funcionou ✅
3. Login com as mesmas credenciais
4. **Esperado**: Deve levar a `clientes.html` ✅

---

## 👥 Teste 2: Cadastro de Clientes

### Passo 1: Criar Cliente
1. Estando em `clientes.html`, preencha:
   - Nome: `João Silva`
   - CPF: `123.456.789-00`
   - Telefone: `(11) 99999-9999`
   - Email: `joao@example.com`
   - Status: `Ativo`
   - Risco: `Baixo`
   - Endereço: `Rua Exemplo, 123`
   - Cidade: `São Paulo`

2. Clique "Salvar Cliente"
3. **Esperado**: 
   - Alert: "Cliente salvo com sucesso!"
   - Redireciona para `emprestimos.html` ✅

### Passo 2: Verificar no Swagger
1. Abra Swagger: `http://localhost:3000/api-docs`
2. Vá em `/clientes` > GET
3. Execute
4. **Esperado**: Vê o cliente "João Silva" na lista ✅

---

## 💰 Teste 3: Criar Empréstimo

### Passo 1: Acessar Empréstimos
1. Clique "Calcular" sem preencher
2. **Esperado**: Alert "Preencha todos os campos corretamente"

### Passo 2: Preencher Forma Corretamente
1. Data: (preenchida automaticamente com hoje)
2. Cliente: Selecione `João Silva` da lista
3. Valor do Empréstimo: `1000`
4. Juros: `10`
5. Parcelas: `4`
6. Clique "Calcular"
7. **Esperado**: 
   - Resumo atualiza automaticamente ✅
   - Valor Total: R$ 1.100,00
   - Valor da Parcela: R$ 275,00

### Passo 3: Salvar Empréstimo
1. Clique "Salvar Empréstimo"
2. **Esperado**: 
   - Alert: "Empréstimo salvo com sucesso!"
   - Redireciona para `emprestimos-lista.html` ✅

### Passo 4: Verificar Lista
1. Você deve estar em `emprestimos-lista.html`
2. **Esperado**: 
   - Tabela mostra empréstimo criado
   - Cliente: João Silva
   - Valor: R$ 1.000,00
   - Valor Total: R$ 1.100,00
   - Parcelas: 4x ✅

---

## 📊 Teste 4: Verificar Parcelas no Swagger

### Teste Automático
1. Abra Swagger: `http://localhost:3000/api-docs`
2. Vá em `/parcelas/emprestimos/{id}/parcelas` > GET
3. Substitua `{id}` pelo ID do empréstimo (deve estar na lista)
4. Execute
5. **Esperado**: 
   - Vê 4 parcelas criadas automaticamente ✅
   - Cada uma com vencimento progressivo
   - Status: `pendente` para todas

---

## ❌ Teste 5: Deletar Empréstimo

1. Em `emprestimos-lista.html`, clique "Excluir"
2. Confirme no popup
3. **Esperado**: 
   - Empréstimo removido da tabela ✅
   - Swagger confirma: GET `/emprestimos` devolve lista vazia

---

## 🔐 Teste 6: Segurança - Sem Token

### Teste Acesso Direto (Sem Login)
1. Abra diretamente: `file:///.../clientes.html`
2. **Esperado**: Redireciona para `index.html` (login) ✅

### Teste Token Expirado
1. Abra DevTools (F12)
2. Console: `localStorage.removeItem('sistema_chestao_token')`
3. Recarregue qualquer página
4. **Esperado**: Redireciona para login ✅

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Erro ao carregar clientes" | Verifique se backend está rodando (porta 3000) |
| "401 Unauthorized" | Token inválido/expirado. Limpe localStorage e faça login novamente |
| Clientes não aparecem no select | Verifique se foi criado cliente antes de acessar emprestimos.html |
| Erro CORS | Verifique .env backend: `CORS_ORIGIN=http://localhost:8000` ou `file://` |
| Alert infinito | Abra DevTools, console para ver erro real |

---

## 📝 Checklist Final

- [ ] Auth: Registrar e Login funcionam
- [ ] Clientes: Criar cliente salva no DB
- [ ] Clientes: Select em emprestimos.html carrega lista
- [ ] Emprestimos: Cálculo funciona
- [ ] Emprestimos: Salvar cria no DB
- [ ] Emprestimos-lista: Mostra emprestimos criados
- [ ] Parcelas: Criadas automaticamente via backend
- [ ] Delete: Funciona e remove do DB
- [ ] Segurança: Sem token redireciona para login
- [ ] Swagger: Todos endpoints acessíveis

---

## 🚀 Próximos Passos

Após validar este guia, considere:
1. [ ] Adicionar funcionalidade de EDITAR cliente/emprestimo (UPDATE)
2. [ ] Pagina de Pagamentos (registrar pagamento de parcela)
3. [ ] Relatórios com status dos emprestimos
4. [ ] Autenticação persistente entre sessões
5. [ ] Validação de CPF/Email no frontend antes de enviar
