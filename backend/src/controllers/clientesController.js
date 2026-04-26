/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Listar clientes
 *     tags: [Clientes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de clientes
 *       401:
 *         description: Token não fornecido
 *   post:
 *     summary: Criar novo cliente
 *     tags: [Clientes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               cpf:
 *                 type: string
 *               email:
 *                 type: string
 *               telefone:
 *                 type: string
 *               endereco:
 *                 type: string
 *               cidade:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ativo, inativo, suspendido]
 *               risco:
 *                 type: string
 *                 enum: [baixo, médio, alto]
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: CPF já cadastrado
 * /api/clientes/{id}:
 *   get:
 *     summary: Obter cliente específico
 *     tags: [Clientes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do cliente
 *       404:
 *         description: Cliente não encontrado
 *   put:
 *     summary: Atualizar cliente
 *     tags: [Clientes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *       404:
 *         description: Cliente não encontrado
 *   delete:
 *     summary: Deletar cliente
 *     tags: [Clientes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente deletado
 *       404:
 *         description: Cliente não encontrado
 */

const db = require('../config/database');
const { validarCliente } = require('../validators/clienteValidator');

const criarCliente = async (req, res, next) => {
    try {
        const usuarioId = req.usuarioId;
        const { nome, cpf, email, telefone, endereco, cidade, status, risco, observacoes } = req.body;

        // Validar dados
        const { error, value } = validarCliente(req.body);
        if (error) {
            console.error('Erro de validação:', error);
            return res.status(400).json({ erro: 'Dados inválidos', detalhes: error.details });
        }

        // Remover formatação do CPF
        const cpfLimpo = cpf.replace(/\D/g, '');

        // Verificar se CPF já existe
        const cpfExistente = await db.query(
            'SELECT id FROM clientes WHERE cpf = $1',
            [cpfLimpo]
        );

        if (cpfExistente.rows.length > 0) {
            return res.status(409).json({ erro: 'CPF já cadastrado' });
        }

        // Inserir cliente
        const resultado = await db.query(
            `INSERT INTO clientes (usuario_id, nome, cpf, email, telefone, endereco, cidade, status, risco, observacoes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [usuarioId, nome, cpfLimpo, email || null, telefone || null, endereco || null,
             cidade || null, status || 'ativo', risco || 'baixo', observacoes || null]
        );

        res.status(201).json({
            mensagem: 'Cliente criado com sucesso',
            cliente: resultado.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

const listarClientes = async (req, res, next) => {
    try {
        const usuarioId = req.usuarioId;
        const { pagina = 1, limite = 10 } = req.query;

        const offset = (pagina - 1) * limite;

        const resultado = await db.query(
            `SELECT * FROM clientes WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT $2 OFFSET $3`,
            [usuarioId, limite, offset]
        );

        const total = await db.query(
            'SELECT COUNT(*) FROM clientes WHERE usuario_id = $1',
            [usuarioId]
        );

        res.json({
            clientes: resultado.rows,
            paginacao: {
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                total: parseInt(total.rows[0].count),
                totalPaginas: Math.ceil(total.rows[0].count / limite),
            },
        });
    } catch (err) {
        next(err);
    }
};

const obterCliente = async (req, res, next) => {
    try {
        const usuarioId = req.usuarioId;
        const { id } = req.params;

        const resultado = await db.query(
            'SELECT * FROM clientes WHERE id = $1 AND usuario_id = $2',
            [id, usuarioId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Cliente não encontrado' });
        }

        res.json({ cliente: resultado.rows[0] });
    } catch (err) {
        next(err);
    }
};

const atualizarCliente = async (req, res, next) => {
    try {
        const usuarioId = req.usuarioId;
        const { id } = req.params;
        const { nome, cpf, email, telefone, endereco, cidade, status, risco, observacoes } = req.body;

        // Validar dados
        const { error } = validarCliente(req.body);
        if (error) {
            return res.status(400).json({ erro: 'Dados inválidos', detalhes: error.details });
        }

        // Verificar se cliente existe
        const clienteExistente = await db.query(
            'SELECT id FROM clientes WHERE id = $1 AND usuario_id = $2',
            [id, usuarioId]
        );

        if (clienteExistente.rows.length === 0) {
            return res.status(404).json({ erro: 'Cliente não encontrado' });
        }

        // Remover formatação do CPF
        const cpfLimpo = cpf.replace(/\D/g, '');

        const resultado = await db.query(
            `UPDATE clientes 
             SET nome = $1, cpf = $2, email = $3, telefone = $4, endereco = $5, 
                 cidade = $6, status = $7, risco = $8, observacoes = $9
             WHERE id = $10 AND usuario_id = $11
             RETURNING *`,
            [nome, cpfLimpo, email || null, telefone || null, endereco || null,
             cidade || null, status, risco, observacoes || null, id, usuarioId]
        );

        res.json({
            mensagem: 'Cliente atualizado com sucesso',
            cliente: resultado.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

const deletarCliente = async (req, res, next) => {
    try {
        const usuarioId = req.usuarioId;
        const { id } = req.params;

        // Verificar se cliente existe
        const clienteExistente = await db.query(
            'SELECT id FROM clientes WHERE id = $1 AND usuario_id = $2',
            [id, usuarioId]
        );

        if (clienteExistente.rows.length === 0) {
            return res.status(404).json({ erro: 'Cliente não encontrado' });
        }

        // Verificar se tem empréstimos ativos
        const emprestimosAtivos = await db.query(
            'SELECT COUNT(*) FROM emprestimos WHERE cliente_id = $1 AND status != $2',
            [id, 'cancelado']
        );

        if (emprestimosAtivos.rows[0].count > 0) {
            return res.status(400).json({
                erro: 'Não é possível deletar cliente com empréstimos ativos',
            });
        }

        // Deletar cliente
        await db.query(
            'DELETE FROM clientes WHERE id = $1 AND usuario_id = $2',
            [id, usuarioId]
        );

        res.json({ mensagem: 'Cliente deletado com sucesso' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    criarCliente,
    listarClientes,
    obterCliente,
    atualizarCliente,
    deletarCliente,
};
