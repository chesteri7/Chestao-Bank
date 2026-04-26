// Verificar autenticação
document.addEventListener('DOMContentLoaded', () => {
  if (!authService.isAuthenticated()) {
    window.location.href = 'index.html';
  }
  carregarClientesNoBackend();
  setDataAtual();
});

// Elementos do formulário
const form = document.getElementById("loanForm");
const btnCalcular = document.getElementById("btnCalcular");
const btnSalvar = document.getElementById("btnSalvar");

const dataInput = document.getElementById("data");
const clienteInput = document.getElementById("cliente");
const valorEmprestimoInput = document.getElementById("valorEmprestimo");
const jurosInput = document.getElementById("juros");
const parcelasInput = document.getElementById("parcelas");
const valorTotalInput = document.getElementById("valorTotal");
const valorParcelaInput = document.getElementById("valorParcela");

const resumoCliente = document.getElementById("resumoCliente");
const resumoData = document.getElementById("resumoData");
const resumoValor = document.getElementById("resumoValor");
const resumoJuros = document.getElementById("resumoJuros");
const resumoTotal = document.getElementById("resumoTotal");
const resumoParcelas = document.getElementById("resumoParcelas");
const resumoParcela = document.getElementById("resumoParcela");

// Utilidades
function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(dataISO) {
  if (!dataISO) return "—";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function setDataAtual() {
  const hoje = new Date().toISOString().split('T')[0];
  dataInput.value = hoje;
}

// Carregar clientes do backend
async function carregarClientesNoBackend() {
  try {
    const resposta = await API.clientes.listar(1, 999);
    const clientes = resposta.clientes || [];
    
    clienteInput.innerHTML = '<option value="">Selecione um cliente</option>';
    
    clientes.forEach((cliente) => {
      const option = document.createElement("option");
      option.value = cliente.id;
      option.textContent = cliente.nome;
      option.dataset.clienteId = cliente.id;
      clienteInput.appendChild(option);
    });

    // Tentar selecionar cliente do localStorage (se existir)
    const clienteSelecionado = JSON.parse(localStorage.getItem("clienteSelecionado"));
    if (clienteSelecionado) {
      const opcaoCliente = Array.from(clienteInput.options).find(
        opt => opt.value == clienteSelecionado.id
      );
      if (opcaoCliente) {
        clienteInput.value = clienteSelecionado.id;
        resumoCliente.textContent = clienteSelecionado.nome;
      }
    }
  } catch (err) {
    console.error('Erro ao carregar clientes:', err);
    alert('Erro ao carregar lista de clientes. Tente novamente.');
  }
}

// Calcular empréstimo
function calcularEmprestimo() {
  const data = dataInput.value;
  const clienteId = clienteInput.value;
  const valorEmprestimo = Number(valorEmprestimoInput.value);
  const juros = Number(jurosInput.value);
  const parcelas = Number(parcelasInput.value);

  if (!data || !clienteId || valorEmprestimo <= 0 || juros < 0 || parcelas <= 0) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  if (parcelas > 6 || parcelas < 1) {
    alert("O número de parcelas deve estar entre 1 e 6.");
    parcelasInput.focus();
    return;
  }

  const valorTotal = valorEmprestimo + (valorEmprestimo * juros / 100);
  const valorParcela = valorTotal / parcelas;

  valorTotalInput.value = formatarMoeda(valorTotal);
  valorParcelaInput.value = formatarMoeda(valorParcela);

  const clienteNome = clienteInput.options[clienteInput.selectedIndex].text;
  resumoCliente.textContent = clienteNome;
  resumoData.textContent = formatarData(data);
  resumoValor.textContent = formatarMoeda(valorEmprestimo);
  resumoJuros.textContent = `${juros}%`;
  resumoTotal.textContent = formatarMoeda(valorTotal);
  resumoParcelas.textContent = `${parcelas}x`;
  resumoParcela.textContent = formatarMoeda(valorParcela);
}

// Salvar empréstimo no backend
async function salvarEmprestimoNoBackend() {
  const data = dataInput.value;
  const clienteId = clienteInput.value;
  const valorEmprestimo = Number(valorEmprestimoInput.value);
  const juros = Number(jurosInput.value);
  const parcelas = Number(parcelasInput.value);

  if (!data || !clienteId || valorEmprestimo <= 0 || juros < 0 || parcelas <= 0) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  if (parcelas > 6 || parcelas < 1) {
    alert("O número de parcelas deve estar entre 1 e 6.");
    parcelasInput.focus();
    return;
  }

  try {
    const novoEmprestimo = {
      cliente_id: parseInt(clienteId),
      data: data,
      valor_emprestimo: valorEmprestimo,
      taxa_juros: juros,
      quantidade_parcelas: parcelas
    };

    const resultado = await API.emprestimos.criar(novoEmprestimo);
    
    alert("Empréstimo salvo com sucesso!");
    localStorage.setItem("emprestimoSelecionado", JSON.stringify(resultado));
    
    window.location.href = "emprestimos-lista.html";
  } catch (err) {
    console.error('Erro ao salvar empréstimo:', err);
    alert(`Erro ao salvar empréstimo: ${err.message || 'Tente novamente'}`);
  }
}

// Event listeners
btnCalcular.addEventListener("click", calcularEmprestimo);
btnSalvar.addEventListener("click", salvarEmprestimoNoBackend);

clienteInput.addEventListener("change", () => {
  const clienteNome = clienteInput.options[clienteInput.selectedIndex].text;
  resumoCliente.textContent = clienteNome || "—";
});

form.addEventListener("reset", () => {
  setTimeout(() => {
    valorTotalInput.value = "";
    valorParcelaInput.value = "";
    resumoCliente.textContent = "—";
    resumoData.textContent = "—";
    resumoValor.textContent = "R$ 0,00";
    resumoJuros.textContent = "0%";
    resumoTotal.textContent = "R$ 0,00";
    resumoParcelas.textContent = "0x";
    resumoParcela.textContent = "R$ 0,00";
  }, 0);
});

