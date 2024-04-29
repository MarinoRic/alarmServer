const mysql = require('mysql2');
const dotenv = require('dotenv');
const fs = require("fs");

dotenv.config({path: './config/config.env'});

const pool = mysql.createPool({
    connectionLimit: process.env.DB_CONN_LIMIT, // Numero massimo di connessioni nella pool
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    waitForConnections: true,
    queueLimit: 0,
    uri:  process.env.DB_URI,

});

module.exports = pool;


pool.on('acquire', (connection) => {
    console.log(`Connection ${connection.threadId} acquired`.yellow.italic);
});
pool.on('release', (connection) => {
    console.log(`Connection ${connection.threadId} released`.cyan.italic);
});

module.exports = pool;
