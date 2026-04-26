document.addEventListener("DOMContentLoaded", () => {
  if (!authService.isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  carregarDashboard();
  configurarLogout();
});

const totalClientesEl = document.getElementById("totalClientes");
const totalEmprestimosEl = document.getElementById("totalEmprestimos");
const valorTotalEmprestadoEl = document.getElementById("valorTotalEmprestado");
const valorTotalReceberEl = document.getElementById("valorTotalReceber");
const emprestimosAtivosEl = document.getElementById("emprestimosAtivos");
const lucroPrevistoEl = document.getElementById("lucroPrevisto");
const totalEmAtrasoEl = document.getElementById("totalEmAtraso");
const ultimosEmprestimosBody = document.getElementById("ultimosEmprestimosBody");
const emptyState = document.getElementById("emptyState");
const btnLogout = document.getElementById("btnLogout");

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(dataISO) {
  if (!dataISO) return "—";

  const data = new Date(dataISO);

  if (!isNaN(data.getTime())) {
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  return "—";
}

async function carregarDashboard() {
  try {
    const [resClientes, resEmprestimos] = await Promise.all([
      API.clientes.listar(1, 999),
      API.emprestimos.listar(1, 999),
    ]);

    const clientes = resClientes.clientes || [];
    const emprestimos = resEmprestimos.emprestimos || [];

    const totalClientes = clientes.length;
    const totalEmprestimos = emprestimos.length;

    const valorTotalEmprestado = emprestimos.reduce(
      (acc, item) => acc + Number(item.valor_emprestimo || 0),
      0
    );

    const valorTotalReceber = emprestimos.reduce(
      (acc, item) => acc + Number(item.valor_total || 0),
      0
    );

    const lucroPrevisto = valorTotalReceber - valorTotalEmprestado;

    const ativos = emprestimos.filter(
      (item) => item.status === "ativo"
    ).length;

    let valorTotalAtrasado = 0;

for (const emprestimo of emprestimos) {
  try {
    const respostaParcelas = await API.parcelas.obterStatus(emprestimo.id);
    const parcelas = respostaParcelas.parcelas || [];

    parcelas.forEach((parcela) => {
      const status = parcela.status_exibicao || parcela.status;

      if (status === "atrasado") {
        valorTotalAtrasado += Number(parcela.valor_parcela || 0);
      }
    });
  } catch (error) {
    console.error(`Erro ao buscar parcelas do empréstimo ${emprestimo.id}:`, error);
  }
}

    totalClientesEl.textContent = totalClientes;
    totalEmprestimosEl.textContent = totalEmprestimos;
    valorTotalEmprestadoEl.textContent = formatarMoeda(valorTotalEmprestado);
    valorTotalReceberEl.textContent = formatarMoeda(valorTotalReceber);
    emprestimosAtivosEl.textContent = ativos;
    lucroPrevistoEl.textContent = formatarMoeda(lucroPrevisto);
    totalEmAtrasoEl.textContent = formatarMoeda(valorTotalAtrasado);

    renderizarUltimosEmprestimos(emprestimos);
  } catch (err) {
    console.error("Erro ao carregar dashboard:", err);
  }
}

function renderizarUltimosEmprestimos(emprestimos) {
  ultimosEmprestimosBody.innerHTML = "";

  if (!emprestimos.length) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  const ultimos = [...emprestimos].slice(0, 5);

  ultimos.forEach((emprestimo) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${emprestimo.cliente_nome || '—'}</td>
      <td>${formatarData(emprestimo.data)}</td>
      <td>${formatarMoeda(emprestimo.valor_emprestimo)}</td>
      <td>${emprestimo.taxa_juros}%</td>
      <td>${emprestimo.quantidade_parcelas}x</td>
      <td>${formatarMoeda(emprestimo.valor_total)}</td>
      <td><span class="status-badge">${emprestimo.status}</span></td>
    `;

    ultimosEmprestimosBody.appendChild(tr);
  });
}

function configurarLogout() {
  btnLogout.addEventListener("click", () => {
    authService.removeToken();
    window.location.href = "index.html";
  });
}