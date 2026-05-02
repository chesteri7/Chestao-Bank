const Joi = require('joi');

const emprestimoSchema = Joi.object({
    cliente_id: Joi.number().integer().positive().required(),
    data: Joi.date().iso().required(),
    valor_emprestimo: Joi.number().precision(2).positive().required(),
    taxa_juros: Joi.number().precision(2).min(0).required(),
    quantidade_parcelas: Joi.number().integer().min(1).max(6).required(),
    custo_parcela: Joi.number().precision(2).min(0).default(0),
});

const validarEmprestimo = (dados) => {
    return emprestimoSchema.validate(dados, { abortEarly: false });
};

module.exports = {
    validarEmprestimo,
};
