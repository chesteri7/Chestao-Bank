-- Schema inicial para Sistema Chestao
-- Banco de dados já deve estar criado antes de executar este script

-- Tabela: usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(255),
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco VARCHAR(500),
    cidade VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspendido')),
    risco VARCHAR(50) DEFAULT 'baixo' CHECK (risco IN ('baixo', 'médio', 'alto')),
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: emprestimos
CREATE TABLE emprestimos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    valor_emprestimo DECIMAL(12, 2) NOT NULL,
    taxa_juros DECIMAL(5, 2) NOT NULL,
    quantidade_parcelas INTEGER NOT NULL,
    valor_total DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'pago', 'cancelado')),
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: parcelas
CREATE TABLE parcelas (
    id SERIAL PRIMARY KEY,
    emprestimo_id INTEGER NOT NULL REFERENCES emprestimos(id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL,
    valor_parcela DECIMAL(12, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelada')),
    valor_pago DECIMAL(12, 2) DEFAULT 0,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE(emprestimo_id, numero_parcela)
);

-- Tabela: historico_pagamentos
CREATE TABLE historico_pagamentos (
    id SERIAL PRIMARY KEY,
    parcela_id INTEGER NOT NULL REFERENCES parcelas(id) ON DELETE CASCADE,
    valor_pago DECIMAL(12, 2) NOT NULL,
    data_pagamento TIMESTAMP NOT NULL,
    metodo_pagamento VARCHAR(100),
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_clientes_usuario_id ON clientes(usuario_id);
CREATE INDEX idx_clientes_cpf ON clientes(cpf);
CREATE INDEX idx_emprestimos_usuario_id ON emprestimos(usuario_id);
CREATE INDEX idx_emprestimos_cliente_id ON emprestimos(cliente_id);
CREATE INDEX idx_parcelas_emprestimo_id ON parcelas(emprestimo_id);
CREATE INDEX idx_historico_parcela_id ON historico_pagamentos(parcela_id);

-- Trigger para atualizar atualizado_em automaticamente (usuarios)
CREATE OR REPLACE FUNCTION atualizar_atualizado_em_usuarios()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_atualizado_em_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_atualizado_em_usuarios();

-- Trigger para atualizar atualizado_em automaticamente (clientes)
CREATE OR REPLACE FUNCTION atualizar_atualizado_em_clientes()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_atualizado_em_clientes
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_atualizado_em_clientes();

-- Trigger para atualizar atualizado_em automaticamente (emprestimos)
CREATE OR REPLACE FUNCTION atualizar_atualizado_em_emprestimos()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_atualizado_em_emprestimos
    BEFORE UPDATE ON emprestimos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_atualizado_em_emprestimos();

-- Trigger para atualizar atualizado_em automaticamente (parcelas)
CREATE OR REPLACE FUNCTION atualizar_atualizado_em_parcelas()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_atualizado_em_parcelas
    BEFORE UPDATE ON parcelas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_atualizado_em_parcelas();
