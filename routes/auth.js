const express = require('express');
const router = express.Router();
const attachDB = require('../middleware/dbconnection');

const {login, register} = require('../controllers/auth');

router.use(attachDB);

router.route('/login')
    .post(login);

router.route('/register')
    .post(register);


module.exports = router;