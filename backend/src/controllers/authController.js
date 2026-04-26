/**
 * @swagger
 * /api/auth/registrar:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 example: usuario@example.com
 *               senha:
 *                 type: string
 *                 example: senha123
 *               nome:
 *                 type: string
 *                 example: João Silva
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     nome:
 *                       type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Email já cadastrado
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Fazer login
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 example: usuario@example.com
 *               senha:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 usuario:
 *                   type: object
 *                 token:
 *                   type: string
 *       401:
 *         description: Email ou senha inválidos
 *       403:
 *         description: Usuário inativo
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config/env');

const registrar = async (req, res, next) => {
    try {
        const { email, senha, nome } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
        }

        // Verificar se usuário já existe
        const usuarioExistente = await db.query(
            'SELECT id FROM usuarios WHERE email = $1',
            [email]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(409).json({ erro: 'Email já cadastrado' });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Criar usuário
        const resultado = await db.query(
            'INSERT INTO usuarios (email, senha_hash, nome) VALUES ($1, $2, $3) RETURNING id, email, nome',
            [email, senhaHash, nome || null]
        );

        const usuario = resultado.rows[0];

        // Gerar token JWT
        const token = jwt.sign(
            { usuarioId: usuario.id, email: usuario.email },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.status(201).json({
            mensagem: 'Usuário registrado com sucesso',
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nome: usuario.nome,
            },
            token,
        });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
        }

        // Buscar usuário
        const resultado = await db.query(
            'SELECT id, email, nome, senha_hash, ativo FROM usuarios WHERE email = $1',
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({ erro: 'Email ou senha inválidos' });
        }

        const usuario = resultado.rows[0];

        if (!usuario.ativo) {
            return res.status(403).json({ erro: 'Usuário inativo' });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ erro: 'Email ou senha inválidos' });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { usuarioId: usuario.id, email: usuario.email },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.json({
            mensagem: 'Login realizado com sucesso',
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nome: usuario.nome,
            },
            token,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    registrar,
    login,
};
