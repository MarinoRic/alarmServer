const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config({path: './config/config.env'});

const pool = mysql.createPool({
    connectionLimit: process.env.CONN_LIMIT,
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

pool.on('acquire', (connection) => {
    console.log('Connection %d acquired'.yellow.italic, connection.threadId);
});
pool.on('release', (connection) => {
    console.log('Connection %d relased'.cyan.italic, connection.threadId);
});

module.exports = pool;

