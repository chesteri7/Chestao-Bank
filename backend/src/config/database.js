const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool(config.db);

pool.on('error', (err) => {
    console.error('Erro não esperado no pool de conexões', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool,
};
