// module.exports rimossi per la chiarezza, vanno aggiunti alla fine del file se necessario

const ErrorResponse = require('./ErrorResponse'); // Assicurati che il percorso sia corretto

function executeQuery(pool, query) {
    const sql = query.sql;
    const params = query.params || [];

    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                reject(new ErrorResponse('Failed to obtain database connection: ' + err.message, 500));
                return;
            }
            connection.query(sql, params, (error, results) => {
                connection.release();
                if (error) {
                    reject(new ErrorResponse('Failed to execute query: ' + error.message, 400));
                    return;
                }
                resolve(results);
            });
        });
    });
}

module.exports.executeQuery = executeQuery;
