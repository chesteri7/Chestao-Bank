const express = require('express');
const documentosController = require('../controllers/documentosController');
const emprestimosController = require('../controllers/emprestimosController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', emprestimosController.criarEmprestimo);
router.get('/', emprestimosController.listarEmprestimos);
router.get('/:id', emprestimosController.obterEmprestimo);
router.put('/:id', emprestimosController.atualizarEmprestimo);
router.delete('/:id', emprestimosController.deletarEmprestimo);
router.get('/:id/documentos', documentosController.listarDocumentos);
router.post('/:id/documentos', documentosController.adicionarDocumento);

module.exports = router;
