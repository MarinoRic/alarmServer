const ErrorResponse = require("../utils/ErrorResponse")
const queryHandler = require('../utils/query')
const {executeQuery} = require("../utils/query");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

exports.login = async (req, res, next) => {
    try {
        req.query.sql = `SELECT 
                            user_id AS id, 
                            email, 
                            password
                        FROM user_authentication 
                        WHERE email=?;`;

        const {email, password} = req.body;

        if (!email || !password) return next(new ErrorResponse('Please provide an email and a password', 401));

        req.query.params = [email];

        let user = await executeQuery(req.pool, req.query);

        if (!user) return next(new ErrorResponse('Invalid credetials', 401)); else user = user[0];

         const isMatch = await matchPassword(password, user.password);

        if (!isMatch) return next(new ErrorResponse('Invalid credetials - po', 401));

        const payload = {
            id: user.id, email: user.email
        };

        let token = jwt.sign(payload, process.env.JWT_SECRET, {});

        res.status(200).cookie('token', token, {
            httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 * 30
        }).json(token);

    } catch (err) {
        console.log(err);
    }
};


exports.register = async (req, res, next) => {
    const {email, password, name, surname, role = 'user'} = {...req.body};
    if (!email || !password || !name || !surname) return next(new ErrorResponse('Please, provide an email, password, name and surname', 400))

    console.log(role === 'admin');


    let token_admin;
    if (role === 'admin') {
        if (!req.body.token) return next(new ErrorResponse('Token is required to register as administrator', 401));
        token_admin = req.body.token;
        if (token_admin !== process.env.TOKEN_ADMIN) return next(new ErrorResponse('Invalid token admin', 401));
    }

    let role_ = (role === 'admin') ? 0 : 1;

    try {
        req.query.sql = `
            INSERT INTO users (email, password,firstname, lastname, role) 
            VALUES (?,?,?,?,?);
        `;


        req.query.params = [email, await hashPassword(password), name, surname, role_];
        await executeQuery(req.pool, req.query);

        req.query.sql = `
            SELECT id
            FROM users 
            WHERE email = ?
        `

        req.query.params = [email];
        const user = executeQuery(req.pool, req.query);

        const payload = {
            id: user.id, email
        };
        let token = jwt.sign(payload, process.env.JWT_SECRET, {});

        res.status(200).cookie('token', token, {
            httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 * 30
        }).json(token);

    } catch (err) {
        return next(new ErrorResponse('ERROR: ' + err.stack, 400))
    }

}

const matchPassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);

    } catch (error) {
        console.error('Error comparing passwords:', error);
        return false;
    }
};

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}