const express = require('express');
const clientesController = require('../controllers/clientesController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', clientesController.criarCliente);
router.get('/', clientesController.listarClientes);
router.get('/:id', clientesController.obterCliente);
router.put('/:id', clientesController.atualizarCliente);
router.delete('/:id', clientesController.deletarCliente);

module.exports = router;
