const documentosController = require('../controllers/documentosController');
const express = require('express');
const authRoutes = require('./auth');
const clientesRoutes = require('./clientes');
const emprestimosRoutes = require('./emprestimos');
const parcelasRoutes = require('./parcelas');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/clientes', clientesRoutes);
router.use('/emprestimos', emprestimosRoutes);
router.use('/parcelas', parcelasRoutes);

module.exports = router;
