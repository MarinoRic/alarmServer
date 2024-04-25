const ErrorResponse = require('../utils/ErrorResponse');

const ErrorHandler = (err, req, res, next) => {
    let error = {...err};
    error.message = err.message;
    console.log(error.message.red.bold)
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server error',
    });

}

module.exports = ErrorHandler;