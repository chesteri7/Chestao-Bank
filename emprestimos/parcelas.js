
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

  emprestimoAtualId = emprestimoId;

  carregarParcelas(emprestimoId);
  carregarDocumentosEmprestimo(emprestimoId);
});

const parcelasTableBody = document.getElementById("parcelasTableBody");
const emptyState = document.getElementById("emptyState");
const loanInfo = document.getElementById("loanInfo");


let parcelaEditando = null;
let emprestimoAtualId = null;

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

    emprestimoAtualId = emprestimoId;

    const emprestimo = resposta.emprestimo;
    const parcelas = resposta.parcelas || [];

    loanInfo.textContent = `${emprestimo.cliente_nome || `Empréstimo #${emprestimo.id}`} • Valor: ${formatarMoeda(emprestimo.valor_emprestimo)} • Total: ${formatarMoeda(emprestimo.valor_total)}`;

    if (!parcelas.length) {
      emptyState.style.display = "block";
      parcelasTableBody.innerHTML = "";
      return;
    }

    emptyState.style.display = "none";
    renderizarParcelas(parcelas, emprestimoId, emprestimo);
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

function renderizarParcelas(parcelas, emprestimoId, emprestimo) {
  parcelasTableBody.innerHTML = "";

  parcelas.forEach((parcela) => {
    const tr = document.createElement("tr");

    const statusClass =
      parcela.status === "pago" ? "status-pago" : "status-pendente";

    const botaoAcao =
      parcela.status === "pago"
        ? `<button class="btn-disabled" disabled>Pago</button>`
        : `<button class="btn-pay" onclick="pagarParcela(${parcela.id}, ${parcela.valor_parcela}, ${emprestimoId})">Pagar</button>`;

        const custoParcela = Number(parcela.custo_parcela || emprestimo?.custo_parcela || 0);
        const lucroParcela = Number(parcela.valor_parcela || 0) - custoParcela;

    tr.innerHTML = `
  <td>${parcela.numero_parcela}</td>
  <td>${formatarMoeda(parcela.valor_parcela)}</td>
  <td>${formatarMoeda(custoParcela)}</td>
  <td>${formatarMoeda(lucroParcela)}</td>
  <td>${formatarData(parcela.data_vencimento)}</td>
  <td>
    <span class="status-badge ${parcela.status_exibicao || parcela.status}">
      ${parcela.status_exibicao || parcela.status}
    </span>
  </td>
  <td>${formatarMoeda(parcela.valor_pago)}</td>
  <td>${formatarData(parcela.data_pagamento)}</td>
  <td>
   <div class="action-buttons">

    ${
    parcela.status !== 'pago'
      ? `
        <button 
        class="icon-btn icon-attach" 
        title="Anexar comprovante"
        onclick="anexarComprovante(${parcela.id}, ${emprestimoId})"
        >
       📎
        </button>

        <button 
        class="icon-btn icon-pay" 
        title="Pagar parcela"
        onclick="pagarParcela(${parcela.id}, ${parcela.valor_parcela}, ${emprestimoId})"
       >
      💰
       </button>

        <button 
        class="icon-btn icon-edit"
        title="Editar parcela"
        onclick='abrirModalEditarParcela(${JSON.stringify(parcela)}, ${JSON.stringify(emprestimo)})'
       >
      ✏️
       </button>
      `
      : `
        ${
          parcela.comprovante_url
            ? `
              <button 
              class="icon-btn icon-view" 
              title="Ver comprovante"
              onclick="abrirModalComprovante('${parcela.comprovante_url}')"
              >
             👁️
              </button>
            `
            : ''
        }

        <button 
        class="icon-btn icon-attach" 
        title="Trocar comprovante"
        onclick="anexarComprovante(${parcela.id}, ${emprestimoId})"
        >
        🔁
        </button>
      `
  }

        <button 
        class="icon-btn icon-whatsapp"
        title="Cobrar via WhatsApp"
        onclick="cobrarWhatsApp('${parcela.cliente_nome}', '${parcela.telefone}', '${formatarMoeda(parcela.valor_parcela)}', '${formatarData(parcela.data_vencimento)}')"
        >
       💬
       </button>
       </div>
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

function abrirModalEditarParcela(parcela, emprestimo) {
  parcelaEditando = parcela;

  document.getElementById("editValorParcela").value = Number(parcela.valor_parcela || 0);
  document.getElementById("editCustoParcela").value = Number(emprestimo?.custo_parcela || 0);
  document.getElementById("editDataVencimento").value = parcela.data_vencimento?.split("T")[0];

  document.getElementById("editarParcelaModal").style.display = "flex";
}

function fecharModalEditarParcela() {
  parcelaEditando = null;
  document.getElementById("editarParcelaModal").style.display = "none";
}

async function salvarEdicaoParcela() {
  if (!parcelaEditando) return;

  const dados = {
    valor_parcela: Number(document.getElementById("editValorParcela").value),
    custo_parcela: Number(document.getElementById("editCustoParcela").value || 0),
    data_vencimento: document.getElementById("editDataVencimento").value,
  };

  try {
    await API.parcelas.atualizarParcela(parcelaEditando.id, dados);
    alert("Parcela atualizada com sucesso!");
    fecharModalEditarParcela();
    carregarParcelas(emprestimoAtualId);
  } catch (err) {
    console.error("Erro ao editar parcela:", err);
    alert(`Erro ao editar parcela: ${err.message}`);
  }
}

function cobrarWhatsApp(nome, telefone, valor, data) {
  const telefoneLimpo = String(telefone || "").replace(/\D/g, "");

  const telefoneFinal = telefoneLimpo.startsWith("55")
    ? telefoneLimpo
    : `55${telefoneLimpo}`;

  const mensagem = `Olá ${nome}, tudo bem? 😊

Passando para lembrar sobre a parcela no valor de ${valor}, com vencimento em ${data}.

Pode me confirmar, por favor?`;

  const url = `https://wa.me/${telefoneFinal}?text=${encodeURIComponent(mensagem)}`;

  window.open(url, "_blank");
}

async function carregarDocumentosEmprestimo(emprestimoId) {
  try {
    const documentos = await API.emprestimos.listarDocumentos(emprestimoId);

    const container = document.getElementById("listaDocumentosEmprestimo");
    container.innerHTML = "";

    if (!documentos.length) {
      container.innerHTML = `<p class="no-file">Nenhum documento anexado.</p>`;
      return;
    }

    documentos.forEach((doc) => {
      const item = document.createElement("div");
      item.className = "documento-item";

      item.innerHTML = `
        <a href="http://localhost:3000${doc.url}" target="_blank">
          📄 ${doc.nome_arquivo}
        </a>
      `;

      container.appendChild(item);
    });
  } catch (err) {
    console.error("Erro ao carregar documentos:", err);
  }
}

async function adicionarDocumentoEmprestimo() {
  const input = document.createElement("input");

  input.type = "file";
  input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx";

  input.onchange = async () => {
    const arquivo = input.files[0];

    if (!arquivo) return;

    const formData = new FormData();
    formData.append("documento", arquivo);

    try {
      const response = await fetch(
        `http://localhost:3000/api/emprestimos/${emprestimoAtualId}/documentos`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authService.getToken()}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao enviar documento");
      }

      alert("Documento enviado com sucesso!");
      carregarDocumentosEmprestimo(emprestimoAtualId);
    } catch (err) {
      console.error("Erro ao enviar documento:", err);
      alert("Erro ao enviar documento");
    }
  };

  input.click();
}