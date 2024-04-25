const pool = require('../config/database');

const connectDB = function (req, res, next) {

    req.pool = pool;

    next()
}

module.exports = connectDB;