// Verificar autenticação
document.addEventListener('DOMContentLoaded', () => {
  if (!authService.isAuthenticated()) {
    window.location.href = 'index.html';
  }
});

// Elementos do formulário
const nomeInput = document.getElementById("nome");
const cpfInput = document.getElementById("cpf");
const telefoneInput = document.getElementById("telefone");
const statusInput = document.getElementById("status");
const riscoInput = document.getElementById("risco");
const form = document.getElementById("clientForm");

const emailInput = document.getElementById("email");
const enderecoInput = document.getElementById("endereco");
const cidadeInput = document.getElementById("cidade");
const observacoesInput = document.getElementById("observacoes");

const previewNome = document.getElementById("previewNome");
const previewCpf = document.getElementById("previewCpf");
const previewTelefone = document.getElementById("previewTelefone");
const previewStatus = document.getElementById("previewStatus");
const previewRisco = document.getElementById("previewRisco");

// Mascaras
function aplicarMascaraCPF(valor) {
  return valor
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);
}

function aplicarMascaraTelefone(valor) {
  return valor
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
}

function atualizarPreview() {
  previewNome.textContent = nomeInput.value.trim() || "—";
  previewCpf.textContent = cpfInput.value.trim() || "—";
  previewTelefone.textContent = telefoneInput.value.trim() || "—";
  previewStatus.textContent = statusInput.value || "—";
  previewRisco.textContent = riscoInput.value || "—";
}

// Event listeners para input
cpfInput.addEventListener("input", () => {
  cpfInput.value = aplicarMascaraCPF(cpfInput.value);
  atualizarPreview();
});

telefoneInput.addEventListener("input", () => {
  telefoneInput.value = aplicarMascaraTelefone(telefoneInput.value);
  atualizarPreview();
});

nomeInput.addEventListener("input", atualizarPreview);
statusInput.addEventListener("change", atualizarPreview);
riscoInput.addEventListener("change", atualizarPreview);

// Submit do formulário
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nome = nomeInput.value.trim();
  const cpf = cpfInput.value.trim().replace(/\D/g, "");
  const telefone = telefoneInput.value.trim();
  const email = emailInput.value.trim();
  const status = statusInput.value;
  const risco = riscoInput.value;
  const endereco = enderecoInput.value.trim();
  const cidade = cidadeInput.value.trim();
  const observacoes = observacoesInput.value.trim();

  if (!nome || !cpf || !telefone || !status || !risco) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  try {
    const novoCliente = {
      nome,
      cpf,
      telefone,
      email: email || null,
      status,
      risco,
      endereco: endereco || null,
      cidade: cidade || null,
      observacoes: observacoes || null
    };

    const resultado = await API.clientes.criar(novoCliente);
    
    alert("Cliente salvo com sucesso!");
    localStorage.setItem("clienteSelecionado", JSON.stringify(resultado));
    
    window.location.href = "emprestimos.html";
  } catch (err) {
    console.error('Erro ao salvar cliente:', err);
    alert(`Erro ao salvar cliente: ${err.message || 'Tente novamente'}`);
  }
});

form.addEventListener("reset", () => {
  setTimeout(() => {
    previewNome.textContent = "—";
    previewCpf.textContent = "—";
    previewTelefone.textContent = "—";
    previewStatus.textContent = "—";
    previewRisco.textContent = "—";
  }, 0);
});