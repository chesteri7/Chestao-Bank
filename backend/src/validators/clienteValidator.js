const Joi = require('joi');

const clienteSchema = Joi.object({
    nome: Joi.string().min(3).max(255).required(),
    cpf: Joi.string()
        .pattern(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
        .required()
        .messages({
            'string.pattern.base': 'CPF deve ter 11 dígitos ou estar formatado como XXX.XXX.XXX-XX',
        }),
    email: Joi.string().email().allow(null, ''),
    telefone: Joi.string().max(20).allow(null, ''),
    endereco: Joi.string().max(500).allow(null, ''),
    cidade: Joi.string().max(100).allow(null, ''),
    status: Joi.string()
        .valid('ativo', 'inativo', 'suspendido')
        .default('ativo'),
    risco: Joi.string()
        .valid('baixo', 'medio', 'alto')
        .default('baixo'),
    observacoes: Joi.string().allow(null, ''),
});

const validarCliente = (dados) => {
    return clienteSchema.validate(dados, { abortEarly: false });
};

module.exports = {
    validarCliente,
};
