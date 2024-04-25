class ErrorResponse extends Error {
    constructor(err, code) {
        super(err);
        this.code = code;
    }
}

module.exports = ErrorResponse;

