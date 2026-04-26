document.addEventListener('DOMContentLoaded', carregarClientes);

const tableBody = document.getElementById("clientesTableBody");
const emptyState = document.getElementById("emptyState");

async function carregarClientes() {
  try {
    const resposta = await API.clientes.listar(1, 999);
    /*const clientes = resposta.dados || [];*/
    const clientes = resposta.clientes || resposta.dados || [];

    if (clientes.length === 0) {
      emptyState.style.display = "block";
      tableBody.innerHTML = "";
      return;
    }

    emptyState.style.display = "none";
    renderizarClientes(clientes);
  } catch (err) {
    console.error(err);
    emptyState.textContent = "Erro ao carregar clientes";
  }
}

function renderizarClientes(clientes) {
  tableBody.innerHTML = "";

  clientes.forEach(cliente => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${cliente.nome}</td>
      <td>${cliente.cpf}</td>
      <td>${cliente.telefone}</td>
      <td>
        <button class="btn btn-danger" onclick="excluirCliente(${cliente.id})">
          Excluir
        </button>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

async function excluirCliente(id) {
  const confirmar = confirm("Deseja excluir este cliente?");
  if (!confirmar) return;

  try {
    await API.clientes.deletar(id);
    alert("Cliente excluído!");
    carregarClientes();
  } catch (err) {
    alert("Erro ao excluir cliente");
  }
}