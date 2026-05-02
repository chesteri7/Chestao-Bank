/**
 * @swagger
 * /api/parcelas/emprestimos/{emprestimoId}/parcelas:
 *   get:
 *     summary: Listar parcelas de um empréstimo
 *     tags: [Parcelas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emprestimoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de parcelas
 *       404:
 *         description: Empréstimo não encontrado
 * /api/parcelas/{parcelaId}/pagar:
 *   post:
 *     summary: Registrar pagamento de parcela
 *     tags: [Parcelas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parcelaId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - valor_pago
 *             properties:
 *               valor_pago:
 *                 type: number
 *               metodo_pagamento:
 *                 type: string
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pagamento registrado com sucesso
 *       400:
 *         description: Valor inválido
 *       404:
 *         description: Parcela não encontrada
 * /api/parcelas/emprestimos/{emprestimoId}/status:
 *   get:
 *     summary: Obter status de pagamentos do empréstimo
 *     tags: [Parcelas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emprestimoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Status de pagamentos com resumo
 *       404:
 *         description: Empréstimo não encontrado
 */

const db = require('../config/database');

const listarParcelasPorEmprestimo = async (req, res, next) => {
    try {
        const usuarioId = req.usuarioId;
        const { emprestimoId } = req.params;

        // Verificar se empréstimo existe e pertence ao usuário
        const emprestimo = await db.query(
    `SELECT e.*, c.nome AS cliente_nome
     FROM emprestimos e
     JOIN clientes c ON c.id = e.cliente_id
     WHERE e.id = $1 AND e.usuario_id = $2`,
    [emprestimoId, usuarioId]
);

        if (emprestimo.rows.length === 0) {
            return res.status(404).json({ erro: 'Empréstimo não encontrado' });
        }

        const resultado = await db.query(
        `SELECT 
         p.*,
        c.nome AS cliente_nome,
        c.telefone AS telefone
        FROM parcelas p
        JOIN emprestimos e ON e.id = p.emprestimo_id
        JOIN clientes c ON c.id = e.cliente_id
        WHERE p.emprestimo_id = $1
        ORDER BY p.numero_parcela ASC`,
        [emprestimoId]
);

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

const parcelasComStatus = resultado.rows.map((parcela) => {
    const vencimento = new Date(parcela.data_vencimento);
    vencimento.setHours(0, 0, 0, 0);

    let statusExibicao = parcela.status;

    if (parcela.status !== 'pago' && vencimento < hoje) {
        statusExibicao = 'atrasado';
    }

    return {
        ...parcela,
        status_exibicao: statusExibicao
    };
});

res.json({ parcelas: parcelasComStatus });
    } catch (err) {
        next(err);
    }
};

const registrarPagamentoParcela = async (req, res, next) => {
    try {
        const usuarioId = req.usuarioId;
        const { parcelaId } = req.params;
        const { valor_pago, metodo_pagamento, observacoes } = req.body;
const valorPagoNumerico = Number(valor_pago);

if (!valorPagoNumerico || valorPagoNumerico <= 0) {
    return res.status(400).json({ erro: 'Valor do pagamento deve ser maior que zero' });
}

        // Buscar parcela
        const parcela = await db.query(
            `SELECT p.* FROM parcelas p 
             INNER JOIN emprestimos e ON p.emprestimo_id = e.id 
             WHERE p.id = $1 AND e.usuario_id = $2`,
            [parcelaId, usuarioId]
        );

        if (parcela.rows.length === 0) {
            return res.status(404).json({ erro: 'Parcela não encontrada' });
        }

        const parcelaAtual = parcela.rows[0];

        // Atualizar parcela
        const valorPagoAtual = Number(parcelaAtual.valor_pago || 0);
const valorParcela = Number(parcelaAtual.valor_parcela || 0);

const novoValorPago = valorPagoAtual + valorPagoNumerico;
const novoStatus = novoValorPago >= valorParcela ? 'pago' : 'pendente';

        const resultadoParcela = await db.query(
    `UPDATE parcelas 
     SET valor_pago = $1, status = $2, data_pagamento = CURRENT_DATE
     WHERE id = $3
     RETURNING *`,
    [novoValorPago, novoStatus, parcelaId]
);

// Registrar no histórico de pagamentos
await db.query(
    `INSERT INTO historico_pagamentos (parcela_id, valor_pago, data_pagamento, metodo_pagamento, observacoes)
     VALUES ($1, $2, NOW(), $3, $4)`,
    [parcelaId, valorPagoNumerico, metodo_pagamento || null, observacoes || null]
);

// Verificar se todas as parcelas do empréstimo foram pagas
const parcelasRestantes = await db.query(
    `SELECT COUNT(*) AS total
     FROM parcelas
     WHERE emprestimo_id = $1
       AND status != 'pago'`,
    [parcelaAtual.emprestimo_id]
);

if (Number(parcelasRestantes.rows[0].total) === 0) {
    await db.query(
        `UPDATE emprestimos
         SET status = 'quitado'
         WHERE id = $1`,
        [parcelaAtual.emprestimo_id]
    );
}

res.json({
    mensagem: 'Pagamento registrado com sucesso',
    parcela: resultadoParcela.rows[0],
    emprestimo_quitado: Number(parcelasRestantes.rows[0].total) === 0
});
    } catch (err) {
        next(err);
    }
};

const obterStatusPagamentos = async (req, res, next) => {
    try {
        const usuarioId = req.usuarioId;
        const { emprestimoId } = req.params;

        // Verificar se empréstimo existe
        const emprestimo = await db.query(
    `SELECT e.*, c.nome AS cliente_nome
     FROM emprestimos e
     JOIN clientes c ON c.id = e.cliente_id
     WHERE e.id = $1 AND e.usuario_id = $2`,
    [emprestimoId, usuarioId]
);

        if (emprestimo.rows.length === 0) {
            return res.status(404).json({ erro: 'Empréstimo não encontrado' });
        }

        const parcelas = await db.query(
  `SELECT 
      p.*,
      c.nome AS cliente_nome,
      c.telefone AS telefone
   FROM parcelas p
   JOIN emprestimos e ON e.id = p.emprestimo_id
   JOIN clientes c ON c.id = e.cliente_id
   WHERE p.emprestimo_id = $1
   ORDER BY p.numero_parcela ASC`,
  [emprestimoId]
);

        const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

const parcelasComStatus = parcelas.rows.map((parcela) => {
    const vencimento = new Date(parcela.data_vencimento);
    vencimento.setHours(0, 0, 0, 0);

    let statusExibicao = parcela.status;

    if (parcela.status !== 'pago' && vencimento < hoje) {
        statusExibicao = 'atrasado';
    }

    return {
        ...parcela,
        status_exibicao: statusExibicao
    };
});

        // Calcular resumo
        const totalParcelas = parcelasComStatus.length;
const parcelasPagas = parcelasComStatus.filter(p => p.status_exibicao === 'pago').length;
const parcelasPendentes = parcelasComStatus.filter(p => p.status_exibicao === 'pendente').length;
const parcelasAtrasadas = parcelasComStatus.filter(p => p.status_exibicao === 'atrasado').length;
const valorPago = parcelasComStatus.reduce((acc, p) => acc + (p.valor_pago || 0), 0);

        res.json({
            emprestimo: emprestimo.rows[0],
            resumo: {
                totalParcelas,
                parcelasPagas,
                parcelasPendentes,
                parcelasAtrasadas,
                valorPago,
                percentualPago: ((parcelasPagas / totalParcelas) * 100).toFixed(2),
            },
            parcelas: parcelasComStatus,
        });
    } catch (err) {
        next(err);
    }
};

const uploadComprovante = async (req, res, next) => {
  try {
    const usuarioId = req.usuarioId;
    const { parcelaId } = req.params;

    if (!req.file) {
      return res.status(400).json({ erro: "Arquivo não enviado" });
    }

    const parcela = await db.query(
      `SELECT p.*
       FROM parcelas p
       INNER JOIN emprestimos e ON p.emprestimo_id = e.id
       WHERE p.id = $1 AND e.usuario_id = $2`,
      [parcelaId, usuarioId]
    );

    if (parcela.rows.length === 0) {
      return res.status(404).json({ erro: "Parcela não encontrada" });
    }

    const caminho = `/uploads/comprovantes/${req.file.filename}`;

    const resultado = await db.query(
      `UPDATE parcelas
       SET comprovante_url = $1
       WHERE id = $2
       RETURNING *`,
      [caminho, parcelaId]
    );

    res.json({
      mensagem: "Comprovante enviado com sucesso!",
      parcela: resultado.rows[0],
      comprovante_url: caminho,
    });
  } catch (err) {
    next(err);
  }
};

const atualizarParcela = async (req, res, next) => {
  try {
    const usuarioId = req.usuarioId;
    const { parcelaId } = req.params;
    const { valor_parcela, data_vencimento, custo_parcela } = req.body;

    const parcelaExistente = await db.query(
      `SELECT p.*, e.id AS emprestimo_id
       FROM parcelas p
       JOIN emprestimos e ON e.id = p.emprestimo_id
       WHERE p.id = $1 AND e.usuario_id = $2`,
      [parcelaId, usuarioId]
    );

    if (parcelaExistente.rows.length === 0) {
      return res.status(404).json({ erro: "Parcela não encontrada" });
    }

    if (parcelaExistente.rows[0].status === "pago") {
      return res.status(400).json({ erro: "Não é permitido editar parcela já paga" });
    }

    const parcelaAtualizada = await db.query(
      `UPDATE parcelas
       SET valor_parcela = $1,
           data_vencimento = $2
       WHERE id = $3
       RETURNING *`,
      [valor_parcela, data_vencimento, parcelaId]
    );

    if (custo_parcela !== undefined) {
      await db.query(
        `UPDATE emprestimos
         SET custo_parcela = $1
         WHERE id = $2 AND usuario_id = $3`,
        [custo_parcela, parcelaExistente.rows[0].emprestimo_id, usuarioId]
      );
    }

    res.json({
      mensagem: "Parcela atualizada com sucesso",
      parcela: parcelaAtualizada.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const listarProximosVencimentos = async (req, res, next) => {
  try {
    const usuarioId = req.usuarioId;

    const result = await db.query(`
  SELECT 
    p.id,
    p.emprestimo_id,
    p.valor_parcela,
    p.data_vencimento,
    c.nome AS cliente_nome
  FROM parcelas p
  JOIN emprestimos e ON e.id = p.emprestimo_id
  JOIN clientes c ON c.id = e.cliente_id
  WHERE 
    e.usuario_id = $1
    AND p.status != 'pago'
    AND p.data_vencimento >= CURRENT_DATE
    AND p.data_vencimento <= CURRENT_DATE + INTERVAL '3 days'
  ORDER BY p.data_vencimento ASC
`, [usuarioId]);

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
    listarParcelasPorEmprestimo,
    registrarPagamentoParcela,
    obterStatusPagamentos,
    uploadComprovante,
    atualizarParcela,
    listarProximosVencimentos,
};
