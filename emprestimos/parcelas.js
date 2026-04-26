document.addEventListener("DOMContentLoaded", () => {
  if (!authService.isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const emprestimoId = params.get("emprestimoId");

  if (!emprestimoId) {
    alert("Empréstimo não informado.");
    window.location.href = "emprestimos-lista.html";
    return;
  }

  carregarParcelas(emprestimoId);
});

const parcelasTableBody = document.getElementById("parcelasTableBody");
const emptyState = document.getElementById("emptyState");
const loanInfo = document.getElementById("loanInfo");

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
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

async function carregarParcelas(emprestimoId) {
  try {
    const resposta = await API.parcelas.obterStatus(emprestimoId);

    const emprestimo = resposta.emprestimo;
    const parcelas = resposta.parcelas || [];

    loanInfo.textContent = `${emprestimo.cliente_nome || `Empréstimo #${emprestimo.id}`} • Valor: ${formatarMoeda(emprestimo.valor_emprestimo)} • Total: ${formatarMoeda(emprestimo.valor_total)}`;

    if (!parcelas.length) {
      emptyState.style.display = "block";
      parcelasTableBody.innerHTML = "";
      return;
    }

    emptyState.style.display = "none";
    renderizarParcelas(parcelas, emprestimoId);
  } catch (err) {
    console.error("Erro ao carregar parcelas:", err);
    emptyState.textContent = `Erro ao carregar parcelas: ${err.message}`;
    emptyState.style.display = "block";
  }
}

async function anexarComprovante(parcelaId, emprestimoId) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*,.pdf";

  input.onchange = async () => {
    const arquivo = input.files[0];

    if (!arquivo) return;

    try {
      await API.parcelas.uploadComprovante(parcelaId, arquivo);
      alert("Comprovante anexado com sucesso!");
      carregarParcelas(emprestimoId);
    } catch (err) {
      console.error("Erro ao anexar comprovante:", err);
      alert(`Erro ao anexar comprovante: ${err.message}`);
    }
  };

  input.click();
}

function renderizarParcelas(parcelas, emprestimoId) {
  parcelasTableBody.innerHTML = "";

  parcelas.forEach((parcela) => {
    const tr = document.createElement("tr");

    const statusClass =
      parcela.status === "pago" ? "status-pago" : "status-pendente";

    const botaoAcao =
      parcela.status === "pago"
        ? `<button class="btn-disabled" disabled>Pago</button>`
        : `<button class="btn-pay" onclick="pagarParcela(${parcela.id}, ${parcela.valor_parcela}, ${emprestimoId})">Pagar</button>`;

    tr.innerHTML = `
  <td>${parcela.numero_parcela}</td>
  <td>${formatarMoeda(parcela.valor_parcela)}</td>
  <td>${formatarData(parcela.data_vencimento)}</td>
  <td>
    <span class="status-badge ${parcela.status_exibicao || parcela.status}">
      ${parcela.status_exibicao || parcela.status}
    </span>
  </td>
  <td>${formatarMoeda(parcela.valor_pago)}</td>
  <td>${formatarData(parcela.data_pagamento)}</td>
  <td>
    ${
      parcela.comprovante_url
        ? `
          <button 
            class="btn-view" 
            onclick="abrirModalComprovante('${parcela.comprovante_url}')"
          >
            Ver comprovante
          </button>

          <button 
            class="btn-attach" 
            onclick="anexarComprovante(${parcela.id}, ${emprestimoId})"
          >
            Trocar comprovante
          </button>
        `
        : `
          <button 
            class="btn-attach" 
            onclick="anexarComprovante(${parcela.id}, ${emprestimoId})"
          >
            Anexar comprovante
          </button>
        `
    }

    ${
      parcela.status !== 'pago'
        ? `<button class="btn-pay" onclick="pagarParcela(${parcela.id}, ${parcela.valor_parcela}, ${emprestimoId})">
             Pagar
           </button>`
        : `<button class="btn-disabled" disabled>
             Pago
           </button>`
    }
  </td>
`;

    parcelasTableBody.appendChild(tr);
  });
}

async function pagarParcela(parcelaId, valorParcela, emprestimoId) {
  const confirmar = confirm(`Confirmar pagamento da parcela no valor de ${formatarMoeda(valorParcela)}?`);
  if (!confirmar) return;

  try {
    await API.parcelas.registrarPagamento(parcelaId, valorParcela, "pix", "Pagamento registrado pelo sistema");
    alert("Parcela paga com sucesso!");
    carregarParcelas(emprestimoId);
  } catch (err) {
    console.error("Erro ao pagar parcela:", err);
    alert(`Erro ao pagar parcela: ${err.message}`);
  }
}

function abrirModalComprovante(url) {
  const modal = document.getElementById("comprovanteModal");
  const modalBody = document.getElementById("modalBody");

  const arquivoUrl = `http://localhost:3000${url}`;
  const extensao = url.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png", "webp"].includes(extensao)) {
    modalBody.innerHTML = `<img src="${arquivoUrl}" class="modal-image" alt="Comprovante" />`;
  } else if (extensao === "pdf") {
    modalBody.innerHTML = `<iframe src="${arquivoUrl}" class="modal-pdf"></iframe>`;
  } else {
    modalBody.innerHTML = `<a href="${arquivoUrl}" target="_blank">Abrir comprovante</a>`;
  }

  modal.style.display = "flex";
}

function fecharModalComprovante() {
  const modal = document.getElementById("comprovanteModal");
  const modalBody = document.getElementById("modalBody");

  modal.style.display = "none";
  modalBody.innerHTML = "";
}