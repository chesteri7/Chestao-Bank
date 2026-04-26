const express = require('express');
const emprestimosController = require('../controllers/emprestimosController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', emprestimosController.criarEmprestimo);
router.get('/', emprestimosController.listarEmprestimos);
router.get('/:id', emprestimosController.obterEmprestimo);
router.put('/:id', emprestimosController.atualizarEmprestimo);
router.delete('/:id', emprestimosController.deletarEmprestimo);

module.exports = router;
