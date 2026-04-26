const app = require('./src/app');
const config = require('./src/config/env');
const db = require('./src/config/database');

const PORT = config.server.port;

// Testar conexão com o banco de dados
db.query('SELECT NOW()')
    .then(() => {
        console.log('✓ Conexão com banco de dados estabelecida');

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`✓ Servidor rodando em http://localhost:${PORT}`);
            console.log(`✓ Ambiente: ${config.server.env}`);
            console.log(`✓ CORS habilitado para: ${config.server.corsOrigin}`);
        });
    })
    .catch((err) => {
        console.error('✗ Erro ao conectar ao banco de dados:', err.message);
        process.exit(1);
    });

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
    console.error('✗ Erro não tratado:', err);
    process.exit(1);
});
