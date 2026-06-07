document.addEventListener("DOMContentLoaded", () => {
  if (!authService.isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  carregarDashboard();
  carregarProximosVencimentos();
  calcularPrevisaoLucro();
  calcularReceita30Dias();
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

async function carregarProximosVencimentos() {
  try {
    const dados = await API.parcelas.proximosVencimentos();

    const lista = document.getElementById("proximosVencimentosLista");
    lista.innerHTML = "";

    if (dados.length === 0) {
      lista.innerHTML = "<li>Nenhum vencimento próximo</li>";
      return;
    }

    dados.forEach(item => {
      const li = document.createElement("li");

      const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

const vencimento = new Date(item.data_vencimento);
vencimento.setHours(0, 0, 0, 0);

const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));

let classe = "vencimento-proximo";

if (diffDias === 0) {
  classe = "vencimento-hoje";
} else if (diffDias === 1) {
  classe = "vencimento-amanha";
}

li.className = classe;

li.innerHTML = `
  <a href="parcelas.html?emprestimoId=${item.emprestimo_id}" class="vencimento-link">
    <strong>${item.cliente_nome}</strong> 
    – ${formatarData(item.data_vencimento)} 
    – ${formatarMoeda(item.valor_parcela)}
  </a>
`;

      lista.appendChild(li);
    });

  } catch (err) {
    console.error("Erro ao carregar vencimentos:", err);
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

async function calcularPrevisaoLucro() {
  try {
    const resposta = await API.emprestimos.listar(1, 999);
    const emprestimos = resposta.emprestimos || [];

    let lucroRestante = 0;
    let ultimaDataLucro = null;

    for (const emprestimo of emprestimos) {
      try {
        const respostaParcelas = await API.parcelas.obterStatus(emprestimo.id);
        const parcelas = respostaParcelas.parcelas || [];

        parcelas.forEach((parcela) => {
          if (parcela.status === "pago") return;

          const valorParcela = Number(parcela.valor_parcela || 0);
          const custoParcela = Number(emprestimo.custo_parcela || 0);
          const lucroParcela = valorParcela - custoParcela;

          if (lucroParcela > 0) {
            lucroRestante += lucroParcela;

            const dataVencimento = new Date(parcela.data_vencimento);

            if (!ultimaDataLucro || dataVencimento > ultimaDataLucro) {
              ultimaDataLucro = dataVencimento;
            }
          }
        });
      } catch (error) {
        console.error(`Erro ao buscar parcelas do empréstimo ${emprestimo.id}:`, error);
      }
    }

    atualizarCardPrevisaoLucro(lucroRestante, ultimaDataLucro);
  } catch (err) {
    console.error("Erro ao calcular previsão de lucro:", err);
  }
}

function atualizarCardPrevisaoLucro(lucroRestante, ultimaDataLucro) {
  const dataFinalEl = document.getElementById("lucroDataFinal");
  const tempoRestanteEl = document.getElementById("lucroTempoRestante");
  const resumoEl = document.getElementById("lucroResumo");

  if (!dataFinalEl || !tempoRestanteEl || !resumoEl) return;

  if (!ultimaDataLucro) {
    dataFinalEl.textContent = "Sem lucro pendente";
    tempoRestanteEl.textContent = "Nenhuma parcela pendente com lucro.";
    resumoEl.textContent = "Lucro restante: R$ 0,00";
    return;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  ultimaDataLucro.setHours(0, 0, 0, 0);

  const diffMs = ultimaDataLucro - hoje;
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const meses = Math.floor(diasRestantes / 30);
  const dias = diasRestantes % 30;

  let textoTempo = "";

  if (diasRestantes < 0) {
    textoTempo = "Prazo já vencido.";
  } else if (meses > 0) {
    textoTempo = `${meses} mês(es) e ${dias} dia(s) restantes`;
  } else {
    textoTempo = `${diasRestantes} dia(s) restantes`;
  }

  dataFinalEl.textContent = formatarData(ultimaDataLucro);
  tempoRestanteEl.textContent = textoTempo;
  resumoEl.textContent = `Lucro restante: ${formatarMoeda(lucroRestante)}`;
}

async function calcularReceita30Dias() {
  try {
    const resposta = await API.emprestimos.listar(1, 999);
    const emprestimos = resposta.emprestimos || [];

    let receitaPrevista = 0;
    let totalParcelas = 0;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 30);

    for (const emprestimo of emprestimos) {
      try {
        const respostaParcelas = await API.parcelas.obterStatus(emprestimo.id);
        const parcelas = respostaParcelas.parcelas || [];

        parcelas.forEach((parcela) => {
          const dataVencimento = new Date(parcela.data_vencimento);
          dataVencimento.setHours(0, 0, 0, 0);

          const status = parcela.status_exibicao || parcela.status;

          const dentroDos30Dias =
            dataVencimento >= hoje && dataVencimento <= limite;

          const pendente = status !== "pago";

          if (dentroDos30Dias && pendente) {
            receitaPrevista += Number(parcela.valor_parcela || 0);
            totalParcelas += 1;
          }
        });
      } catch (error) {
        console.error(
          `Erro ao buscar parcelas do empréstimo ${emprestimo.id}:`,
          error
        );
      }
    }

    atualizarCardReceita30Dias(receitaPrevista, totalParcelas);
  } catch (err) {
    console.error("Erro ao calcular receita dos próximos 30 dias:", err);
  }
}

function atualizarCardReceita30Dias(valor, quantidadeParcelas) {
  const receitaEl = document.getElementById("receita30Dias");
  const resumoEl = document.getElementById("receita30Resumo");

  if (!receitaEl || !resumoEl) return;

  receitaEl.textContent = formatarMoeda(valor);

  if (quantidadeParcelas === 0) {
    resumoEl.textContent = "Nenhuma parcela pendente nos próximos 30 dias.";
    return;
  }

  resumoEl.textContent = `${quantidadeParcelas} parcela(s) prevista(s) para entrar.`;
}