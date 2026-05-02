/**
 * @swagger
 * /api/emprestimos:
 *   get:
 *     summary: Listar empréstimos
 *     tags: [Empréstimos]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativo, pago, cancelado]
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de empréstimos
 *       401:
 *         description: Token não fornecido
 *   post:
 *     summary: Criar novo empréstimo (gera parcelas automaticamente)
 *     tags: [Empréstimos]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cliente_id
 *               - data
 *               - valor_emprestimo
 *               - taxa_juros
 *               - quantidade_parcelas
 *             properties:
 *               cliente_id:
 *                 type: integer
 *               data:
 *                 type: string
 *                 format: date
 *               valor_emprestimo:
 *                 type: number
 *               taxa_juros:
 *                 type: number
 *               quantidade_parcelas:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Empréstimo criado com sucesso e parcelas geradas
 *       400:
 *         description: Dados inválidos
 * /api/emprestimos/{id}:
 *   get:
 *     summary: Obter empréstimo com parcelas
 *     tags: [Empréstimos]
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
 *         description: Dados do empréstimo e suas parcelas
 *       404:
 *         description: Empréstimo não encontrado
 *   put:
 *     summary: Atualizar empréstimo
 *     tags: [Empréstimos]
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ativo, pago, cancelado]
 *     responses:
 *       200:
 *         description: Empréstimo atualizado
 *       404:
 *         description: Empréstimo não encontrado
 *   delete:
 *     summary: Deletar empréstimo
 *     tags: [Empréstimos]
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
 *         description: Empréstimo deletado
 *       404:
 *         description: Empréstimo não encontrado
 */

const db = require('../config/database');
const { validarEmprestimo } = require('../validators/emprestimoValidator');

const calcularParcelas = (valorEmprestimo, taxa, quantidade) => {
    const valorTotal = valorEmprestimo + (valorEmprestimo * taxa / 100);
    const valorParcela = valorTotal / quantidade;
    return { valorTotal, valorParcela };
};

const criarEmprestimo = async (req, res, next) => {
    try {
        const usuarioId = req.usuarioId;
        const { cliente_id, data, valor_emprestimo, taxa_juros, quantidade_parcelas, custo_parcela } = req.body;

        // Validar dados
        const { error } = validarEmprestimo(req.body);
        if (error) {
            return res.status(400).json({ erro: 'Dados inválidos', detalhes: error.details });
        }

        // Verificar se cliente existe e pertence ao usuário
        const cliente = await db.query(
            'SELECT id FROM clientes WHERE id = $1 AND usuario_id = $2',
            [cliente_id, usuarioId]
        );

        if (cliente.rows.length === 0) {
            return res.status(404).json({ erro: 'Cliente não encontrado' });
        }

        // Calcular valor total e valor da parcela
        const { valorTotal, valorParcela } = calcularParcelas(
            valor_emprestimo,
            taxa_juros,
            quantidade_parcelas
        );

        // Inserir empréstimo
        const resultado = await db.query(
    `INSERT INTO emprestimos (
        usuario_id,
        cliente_id,
        data,
        valor_emprestimo,
        taxa_juros,
        quantidade_parcelas,
        valor_total,
        custo_parcela,
        status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, usuario_id, cliente_id, data, valor_emprestimo, taxa_juros, quantidade_parcelas, valor_total, custo_parcela, status, criado_em`,
    [
        usuarioId,
        cliente_id,
        data,
        valor_emprestimo,
        taxa_juros,
        quantidade_parcelas,
        valorTotal,
        custo_parcela || 0,
        'ativo'
    ]
);

        const emprestimo = resultado.rows[0];

        // Gerar parcelas
        const dataBase = new Date(data);
        const parcelas = [];

        for (let i = 1; i <= quantidade_parcelas; i++) {
            const dataVencimento = new Date(dataBase);
            dataVencimento.setMonth(dataVencimento.getMonth() + i);

            const resultadoParcela = await db.query(
                `INSERT INTO parcelas (emprestimo_id, numero_parcela, valor_parcela, data_vencimento)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [emprestimo.id, i, valorParcela, dataVencimento.toISOString().split('T')[0]]
            );

            parcelas.push(resultadoParcela.rows[0]);
        }

        res.status(201).json({
            mensagem: 'Empréstimo criado com sucesso',
            emprestimo,
            parcelas,
        });
    } catch (err) {
        next(err);
    }
};

const listarEmprestimos = async (req, res, next) => {
    try {
        const usuarioId = req.usuarioId;
        const { pagina = 1, limite = 10, status, clienteId } = req.query;

        const offset = (pagina - 1) * limite;
        let query = `
    SELECT 
        e.*,
        c.nome AS cliente_nome
    FROM emprestimos e
    JOIN clientes c ON c.id = e.cliente_id
    WHERE e.usuario_id = $1
`;
        const params = [usuarioId];

        if (status) {
            query += ` AND e.status = $${params.length + 1}`;
            params.push(status);
        }

        if (clienteId) {
            query += ` AND e.cliente_id = $${params.length + 1}`;
            params.push(clienteId);
        }

        query += ` ORDER BY e.criado_em DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limite, offset);

        const resultado = await db.query(query, params);

        const totalParams = [usuarioId];
        let totalQuery = 'SELECT COUNT(*) FROM emprestimos WHERE usuario_id = $1';

        if (status) {
            totalQuery += ` AND status = $${totalParams.length + 1}`;
            totalParams.push(status);
        }

        if (clienteId) {
            totalQuery += ` AND cliente_id = $${totalParams.length + 1}`;
            totalParams.push(clienteId);
        }

        const total = await db.query(totalQuery, totalParams);

        res.json({
            emprestimos: resultado.rows,
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

const obterEmprestimo = async (req, res, next) => {
    try {
        const usuarioId = req.usuarioId;
        const { id } = req.params;

        const resultado = await db.query(
    `SELECT 
        e.*,
        c.nome AS cliente_nome
     FROM emprestimos e
     JOIN clientes c ON c.id = e.cliente_id
     WHERE e.id = $1 AND e.usuario_id = $2`,
    [id, usuarioId]
);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Empréstimo não encontrado' });
        }

        // Buscar parcelas
        const parcelas = await db.query(
            'SELECT * FROM parcelas WHERE emprestimo_id = $1 ORDER BY numero_parcela ASC',
            [id]
        );

        res.json({
            emprestimo: resultado.rows[0],
            parcelas: parcelas.rows,
        });
    } catch (err) {
        next(err);
    }
};

const atualizarEmprestimo = async (req, res, next) => {
    try {
        const usuarioId = req.usuarioId;
        const { id } = req.params;
        const { status } = req.body;

        // Verificar se empréstimo existe
        const emprestimoExistente = await db.query(
            'SELECT * FROM emprestimos WHERE id = $1 AND usuario_id = $2',
            [id, usuarioId]
        );

        if (emprestimoExistente.rows.length === 0) {
            return res.status(404).json({ erro: 'Empréstimo não encontrado' });
        }

        if (status && !['ativo', 'pago', 'cancelado'].includes(status)) {
            return res.status(400).json({ erro: 'Status inválido' });
        }

        const resultado = await db.query(
            'UPDATE emprestimos SET status = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *',
            [status || emprestimoExistente.rows[0].status, id, usuarioId]
        );

        res.json({
            mensagem: 'Empréstimo atualizado com sucesso',
            emprestimo: resultado.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

const deletarEmprestimo = async (req, res, next) => {
    try {
        const usuarioId = req.usuarioId;
        const { id } = req.params;

        // Verificar se empréstimo existe
        const emprestimoExistente = await db.query(
            'SELECT id FROM emprestimos WHERE id = $1 AND usuario_id = $2',
            [id, usuarioId]
        );

        if (emprestimoExistente.rows.length === 0) {
            return res.status(404).json({ erro: 'Empréstimo não encontrado' });
        }

        // Deletar empréstimo (vai deletar as parcelas em cascata)
        await db.query(
            'DELETE FROM emprestimos WHERE id = $1 AND usuario_id = $2',
            [id, usuarioId]
        );

        res.json({ mensagem: 'Empréstimo deletado com sucesso' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    criarEmprestimo,
    listarEmprestimos,
    obterEmprestimo,
    atualizarEmprestimo,
    deletarEmprestimo,
};
