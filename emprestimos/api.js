/**
 * API Service - Gerenciador de Chamadas ao Backend
 * Arquivo centralizado para todas as requisições REST
 */

const API_URL = 'http://localhost:3000/api';

// ============================================
// GERENCIAMENTO DE TOKEN
// ============================================

class AuthService {
    constructor() {
        this.TOKEN_KEY = 'sistema_chestao_token';
        this.USER_KEY = 'sistema_chestao_user';
    }

    // Armazenar token
    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    // Recuperar token
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    // Remover token (logout)
    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    // Verificar se está autenticado
    isAuthenticated() {
        return !!this.getToken();
    }

    // Armazenar dados do usuário
    setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    // Recuperar dados do usuário
    getUser() {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    }
}

const authService = new AuthService();

// ============================================
// REQUISIÇÕES COM AUTENTICAÇÃO
// ============================================

async function apiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {},
    };

    const token = authService.getToken();
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body instanceof FormData) {
        // NÃO mexe no Content-Type
        options.body = body;
    } else if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();

        // Se erro de autenticação, redirecionar para login
        if (response.status === 401) {
            authService.removeToken();
            window.location.href = 'index.html';
            return null;
        }

        if (!response.ok) {
            throw new Error(data.erro || 'Erro na requisição');
        }

        return data;
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
}

// ============================================
// AUTENTICAÇÃO
// ============================================

const API = {
    // LOGIN / REGISTRO
    auth: {
        registrar: async (email, senha, nome) => {
            const data = await apiRequest('/auth/registrar', 'POST', {
                email,
                senha,
                nome,
            });
            authService.setToken(data.token);
            authService.setUser(data.usuario);
            return data;
        },

        login: async (email, senha) => {
            const data = await apiRequest('/auth/login', 'POST', {
                email,
                senha,
            });
            authService.setToken(data.token);
            authService.setUser(data.usuario);
            return data;
        },

        logout: () => {
            authService.removeToken();
        },
    },

    // ============================================
    // CLIENTES
    // ============================================
    clientes: {
        listar: async (pagina = 1, limite = 10) => {
            return apiRequest(`/clientes?pagina=${pagina}&limite=${limite}`);
        },

        criar: async (cliente) => {
            return apiRequest('/clientes', 'POST', cliente);
        },

        obter: async (id) => {
            return apiRequest(`/clientes/${id}`);
        },

        atualizar: async (id, cliente) => {
            return apiRequest(`/clientes/${id}`, 'PUT', cliente);
        },

        deletar: async (id) => {
            return apiRequest(`/clientes/${id}`, 'DELETE');
        },
    },

    // ============================================
    // EMPRÉSTIMOS
    // ============================================
    emprestimos: {
        listar: async (pagina = 1, limite = 10, status = null, clienteId = null) => {
            let url = `/emprestimos?pagina=${pagina}&limite=${limite}`;
            if (status) url += `&status=${status}`;
            if (clienteId) url += `&clienteId=${clienteId}`;
            return apiRequest(url);
        },

        criar: async (emprestimo) => {
            return apiRequest('/emprestimos', 'POST', emprestimo);
        },

        obter: async (id) => {
            return apiRequest(`/emprestimos/${id}`);
        },

        atualizar: async (id, dados) => {
            return apiRequest(`/emprestimos/${id}`, 'PUT', dados);
        },

        deletar: async (id) => {
            return apiRequest(`/emprestimos/${id}`, 'DELETE');
        },
    },

    // ============================================
    // PARCELAS
    // ============================================
    parcelas: {
        uploadComprovante: async (parcelaId, arquivo) => {
        const formData = new FormData();
        formData.append("comprovante", arquivo);

        return apiRequest(`/parcelas/${parcelaId}/comprovante`, "POST", formData);
        },

        listar: async (emprestimoId) => {
            return apiRequest(`/parcelas/emprestimos/${emprestimoId}/parcelas`);
        },

        registrarPagamento: async (parcelaId, valor_pago, metodo_pagamento = '', observacoes = '') => {
            return apiRequest(`/parcelas/${parcelaId}/pagar`, 'POST', {
                valor_pago,
                metodo_pagamento,
                observacoes,
            });
        },

        obterStatus: async (emprestimoId) => {
            return apiRequest(`/parcelas/emprestimos/${emprestimoId}/status`);
        },
    },
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, authService };
}
