const jwt = require('jsonwebtoken');
const ErrorResponse = require("../utils/ErrorResponse");
const {executeQuery} = require("../utils/query");

const queryReq = `
    SELECT * 
    FROM user_authentication 
    WHERE user_id = ?
`;

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer "))
        token = req.headers.authorization.split(" ")[1];

    else if (req.cookies.token)
        token = req.cookies.token;

    if (!token)
        return next(new ErrorResponse('No token provided'));

    try {
        let decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.query.sql = queryReq;
        req.query.params = [decoded];

        req.user = (await executeQuery(req.pool, req.query))[0];
        next();

    } catch (err) {
        console.log(err.stack);
        return next(new ErrorResponse('User not authorized to this route'));
    }

}
module.exports = protect;