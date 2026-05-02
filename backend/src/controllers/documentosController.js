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
  const { nome_arquivo, url } = req.body;

  try {
    await db.query(
      `INSERT INTO documentos_emprestimo (emprestimo_id, nome_arquivo, url)
       VALUES ($1, $2, $3)`,
      [id, nome_arquivo, url]
    );

    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar documento' });
  }
}

module.exports = {
  listarDocumentos,
  adicionarDocumento
};