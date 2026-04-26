

/**
 * Frontend - Script de Login e Navegação
 * Integrado com Backend Node.js
 */

// Logout
function fazerLogout() {
  if (confirm('Tem certeza que deseja sair?')) {
    authService.removeToken();
    window.location.href = 'index.html';
  }
}

// Adicionar Logout na Topbar
function adicionarBotaoLogout() {
  const topbar = document.querySelector('.topbar-content');
  
  if (topbar && !document.getElementById('btnLogout')) {
    const btnLogout = document.createElement('button');
    btnLogout.id = 'btnLogout';
    btnLogout.textContent = 'Sair';
    btnLogout.onclick = fazerLogout;
    btnLogout.style.cssText = `
      padding: 8px 16px;
      background-color: #ff6b6b;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-left: auto;
    `;
    
    topbar.style.display = 'flex';
    topbar.style.justifyContent = 'space-between';
    topbar.style.alignItems = 'center';
    
    topbar.appendChild(btnLogout);
  }
}

// Chamar ao carregar páginas autenticadas
document.addEventListener('DOMContentLoaded', () => {
  adicionarBotaoLogout();
});

// Login na página index
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async function(event) {
      event.preventDefault();
      
      const email = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const messageElement = document.getElementById("message");
      
      try {
          messageElement.innerHTML = "Autenticando...";
          messageElement.style.color = "blue";
          
          // Chamar endpoint de login do backend
          const resultado = await API.auth.login(email, password);
          
          messageElement.innerHTML = "✓ Login realizado com sucesso! Redirecionando...";
          messageElement.style.color = "green";
          
          // Redirecionar após 1 segundo
          setTimeout(() => {
              window.location.href = "clientes.html";
          }, 1000);
          
      } catch (error) {
          messageElement.style.color = "red";
          messageElement.innerHTML = `✗ Erro: ${error.message || 'Erro na autenticação'}`;
          console.error('Erro de login:', error);
      }
  });
}

// Alterar a imagem de fundo aleatoriamente (apenas na página de login)
window.addEventListener('load', function() {
    // Só auto-muda background na página de login
    if (document.body.classList.contains('login-page') || document.getElementById("loginForm")) {
      const imagens = [
          './assets/imagem moedas.jpg',
          './assets/moedas.jpg',
          './assets/parede.jpg',
          './assets/mao com dinheiro.jpg',
          './assets/euro.jpg',
          './assets/montante dinheiro.jpg'
      ];

      const imagemAleatoria = imagens[Math.floor(Math.random() * imagens.length)];
      document.body.style.backgroundImage = `url('${imagemAleatoria}')`;
    }
});


