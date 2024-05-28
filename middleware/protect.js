const jwt = require('jsonwebtoken');
const ErrorResponse = require("../utils/ErrorResponse");
const { executeQuery } = require("../utils/query");

const queryReq = `
    SELECT * 
    FROM user_authentication 
    WHERE user_id = ?
`;

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer "))
        token = req.headers.authorization.split(" ")[1];
    else if (req.cookies.token) token = req.cookies.token;

    if (!token) return next(new ErrorResponse('No token provided', 401));

    try {
        let decoded = await jwt.verify(token, process.env.JWT_SECRET);

        req.query.sql = queryReq;
        req.query.params = [decoded.id];

        console.log("decoded: " + JSON.stringify(decoded));
        const users = await executeQuery(req.pool, req.query);
        req.user = users[0];

        if (!req.user) {
            return next(new ErrorResponse('User not found', 404));
        }

        console.log("USER: " + JSON.stringify(req.user));
        next();
    } catch (err) {
        console.log(err.stack);
        return next(new ErrorResponse('User authentication failed', 401));
    }
}

module.exports = protect;
