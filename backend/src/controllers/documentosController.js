const fs = require('fs');
const path = require('path');
const db = require('../config/database');
async function listarDocumentos(req, res) {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT * FROM documentos_emprestimo WHERE emprestimo_id = $1 ORDER BY id DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar documentos' });
  }
}

async function adicionarDocumento(req, res) {
  const { id } = req.params;

  try {
    if (!req.file) {
      return res.status(400).json({
        erro: 'Nenhum arquivo enviado'
      });
    }

    const nomeArquivo = req.file.originalname;

    const url = `/uploads/documentos/${req.file.filename}`;

    await db.query(
      `
      INSERT INTO documentos_emprestimo
      (emprestimo_id, nome_arquivo, url)
      VALUES ($1, $2, $3)
      `,
      [id, nomeArquivo, url]
    );

    res.json({
      sucesso: true
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      erro: 'Erro ao salvar documento'
    });
  }
}

async function deletarDocumento(req, res) {
  const { documentoId } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM documentos_emprestimo WHERE id = $1',
      [documentoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: 'Documento não encontrado'
      });
    }

    const documento = result.rows[0];

    const caminhoArquivo = path.join(
      __dirname,
      '../../uploads/documentos',
      path.basename(documento.url)
    );

    if (fs.existsSync(caminhoArquivo)) {
      fs.unlinkSync(caminhoArquivo);
    }

    await db.query(
      'DELETE FROM documentos_emprestimo WHERE id = $1',
      [documentoId]
    );

    res.json({
      sucesso: true
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      erro: 'Erro ao deletar documento'
    });
  }
}

module.exports = {
  listarDocumentos,
  adicionarDocumento,
  deletarDocumento
};