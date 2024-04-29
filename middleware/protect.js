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
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) token = req.headers.authorization.split(" ")[1];

    else if (req.cookies.token) token = req.cookies.token;


    if (!token) return next(new ErrorResponse('No token provided'));

    try {
        let decoded =await jwt.verify(token, process.env.JWT_SECRET).id;

        req.query.sql = queryReq;
        console.log("decoded: " + decoded);
        req.query.params = [decoded];
        req.user = (await executeQuery(req.pool, req.query))[0];
        console.log("USER: " + req.user);
        next();

    } catch (err) {
        console.log(err.stack);
        return next(new ErrorResponse('User authentication failed'));
    }

}
module.exports = protect;