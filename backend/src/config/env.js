require('dotenv').config();

module.exports = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sistema_chestao',
    },
    server: {
        port: process.env.SERVER_PORT || 3000,
        env: process.env.NODE_ENV || 'development',
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8000',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'seu_secret_key_bem_seguro',
        expiresIn: process.env.JWT_EXPIRE || '7d',
    },
};
