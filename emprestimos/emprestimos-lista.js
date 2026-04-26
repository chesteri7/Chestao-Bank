// Verificar autenticação
document.addEventListener('DOMContentLoaded', () => {
  if (!authService.isAuthenticated()) {
    window.location.href = 'index.html';
  }
  carregarEmprestimosDoBackend();
});

const loanTableBody = document.getElementById("loanTableBody");
const emptyState = document.getElementById("emptyState");
const searchClienteInput = document.getElementById("searchCliente");
const filterStatusSelect = document.getElementById("filterStatus");
const dataInicialInput = document.getElementById("dataInicial");
const dataFinalInput = document.getElementById("dataFinal");
const btnLimparFiltros = document.getElementById("btnLimparFiltros");

let emprestimosOriginais = [];

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(dataISO) {
  if (!dataISO) return "—";

  const data = new Date(dataISO);

  if (isNaN(data.getTime())) return "—";

  return data.toLocaleDateString("pt-BR");
}

async function carregarEmprestimosDoBackend() {
  try {
    const resposta = await API.emprestimos.listar(1, 999);
    const emprestimos = resposta.emprestimos || [];
    emprestimosOriginais = emprestimos;

    if (emprestimos.length === 0) {
      emptyState.style.display = "block";
      loanTableBody.innerHTML = "";
      return;
    }

    emptyState.style.display = "none";
    aplicarFiltros();
  } catch (err) {
    console.error('Erro ao carregar empréstimos:', err);
    emptyState.textContent = `Erro ao carregar empréstimos: ${err.message}`;
    emptyState.style.display = "block";
  }
}

function aplicarFiltros() {
  const termoBusca = searchClienteInput.value.trim().toLowerCase();
  const statusSelecionado = filterStatusSelect.value;
  const dataInicial = dataInicialInput.value;
  const dataFinal = dataFinalInput.value;

  let emprestimosFiltrados = [...emprestimosOriginais];

  if (termoBusca) {
    emprestimosFiltrados = emprestimosFiltrados.filter((emprestimo) =>
      (emprestimo.cliente_nome || "")
        .toLowerCase()
        .includes(termoBusca)
    );
  }

  if (statusSelecionado !== "todos") {
    emprestimosFiltrados = emprestimosFiltrados.filter(
      (emprestimo) => (emprestimo.status || "ativo") === statusSelecionado
    );
  }

  if (dataInicial) {
    emprestimosFiltrados = emprestimosFiltrados.filter((emprestimo) => {
      const dataEmprestimo = new Date(emprestimo.data);
      const dataInicio = new Date(dataInicial);
      return dataEmprestimo >= dataInicio;
    });
  }

  if (dataFinal) {
    emprestimosFiltrados = emprestimosFiltrados.filter((emprestimo) => {
      const dataEmprestimo = new Date(emprestimo.data);
      const dataFim = new Date(dataFinal);
      dataFim.setHours(23, 59, 59, 999);
      return dataEmprestimo <= dataFim;
    });
  }

  if (emprestimosFiltrados.length === 0) {
    emptyState.style.display = "block";
    loanTableBody.innerHTML = "";
    emptyState.textContent = "Nenhum empréstimo encontrado com esses filtros.";
    return;
  }

  emptyState.style.display = "none";
  emptyState.textContent = "";
  renderizarEmprestimos(emprestimosFiltrados);
}

function limparFiltros() {
  searchClienteInput.value = "";
  filterStatusSelect.value = "todos";
  dataInicialInput.value = "";
  dataFinalInput.value = "";

  aplicarFiltros();
}

async function excluirEmprestimo(id) {
  const confirmar = confirm("Tem certeza que deseja excluir este empréstimo?");
  if (!confirmar) return;

  try {
    await API.emprestimos.deletar(id);
    alert("Empréstimo excluído com sucesso!");
    carregarEmprestimosDoBackend();
  } catch (err) {
    console.error('Erro ao excluir empréstimo:', err);
    alert(`Erro ao excluir empréstimo: ${err.message}`);
  }
}

function renderizarEmprestimos(emprestimos) {
  loanTableBody.innerHTML = "";

  emprestimos.forEach((emprestimo) => {
    const tr = document.createElement("tr");

    const valorParcela =
  Number(emprestimo.valor_total) / Number(emprestimo.quantidade_parcelas);

    tr.innerHTML = `
  <td>${emprestimo.cliente_nome || '—'}</td>
  <td>${formatarData(emprestimo.data)}</td>
  <td>${formatarMoeda(emprestimo.valor_emprestimo)}</td>
  <td>${emprestimo.taxa_juros}%</td>
  <td>${emprestimo.quantidade_parcelas}x</td>
  <td>${formatarMoeda(emprestimo.valor_total)}</td>
  <td>${formatarMoeda(valorParcela)}</td>
  <td>
  <span class="status ${emprestimo.status || 'ativo'}">
    ${emprestimo.status || 'ativo'}
  </span>
</td>

<td>
  <a href="parcelas.html?emprestimoId=${emprestimo.id}" class="btn btn-primary">
    Parcelas
  </a>

  <button class="btn btn-danger" onclick="excluirEmprestimo(${emprestimo.id})">
    Excluir
  </button>
</td>
`;

    loanTableBody.appendChild(tr);
  });
}

searchClienteInput.addEventListener("input", aplicarFiltros);
filterStatusSelect.addEventListener("change", aplicarFiltros);
dataInicialInput.addEventListener("change", aplicarFiltros);
dataFinalInput.addEventListener("change", aplicarFiltros);
btnLimparFiltros.addEventListener("click", limparFiltros);

