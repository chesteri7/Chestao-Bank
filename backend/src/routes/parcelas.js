const upload = require("../middleware/upload");
const express = require('express');
const parcelasController = require('../controllers/parcelasController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/emprestimos/:emprestimoId/parcelas', parcelasController.listarParcelasPorEmprestimo);
router.post('/:parcelaId/pagar', parcelasController.registrarPagamentoParcela);
router.put("/:parcelaId/editar", parcelasController.atualizarParcela);
router.get('/emprestimos/:emprestimoId/status', parcelasController.obterStatusPagamentos);
router.post("/:parcelaId/comprovante", upload.single("comprovante"), parcelasController.uploadComprovante);
router.get("/proximos-vencimentos", parcelasController.listarProximosVencimentos);

module.exports = router;
