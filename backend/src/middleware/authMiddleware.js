const jwt = require('jsonwebtoken');
const config = require('../config/env');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ erro: 'Token não fornecido' });
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        req.usuarioId = decoded.usuarioId;
        req.email = decoded.email;

        next();
    } catch (err) {
        return res.status(401).json({ erro: 'Token inválido ou expirado', detalhes: err.message });
    }
};

module.exports = authMiddleware;
