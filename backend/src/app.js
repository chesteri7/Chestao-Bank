const express = require('express');
const path = require("path");
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const config = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');


const app = express();
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: config.server.corsOrigin,
    credentials: true,
}));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    swaggerOptions: {
        persistAuthorization: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
}));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', mensagem: 'Servidor funcionando normalmente' });
});

// Rotas
app.use('/api', routes);

// Rota 404
app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
