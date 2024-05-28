const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const sensors = require('./routes/sensors');
const auth = require('./routes/auth');
const ErrorHandler = require('./middleware/ErrorHandler');

dotenv.config({path: './config/config.env'});

const app = express();

app.use(express.json()); //funzione di parsing per garantire l'uso di dati JSON
app.use(cookieParser())

app.use(morgan('dev'));

app.use('/api/v1/sensors', sensors);
app.use('/', auth);

app.use(ErrorHandler);

const PORT = 5000;
const server = app.listen(
    PORT,
    console.log(`Server started on port ${PORT}`.blue.bold)
);

