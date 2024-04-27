const express = require('express');
const connectDB = require('../middleware/dbconnection');
const {queryHandler, responseSender, executeQuery} = require('../utils/query');
const checkZone = require('../middleware/checkZone')
const protect = require('../middleware/protect');
const getAuthorization = require('../middleware/getAuthorization');
const filteredResults = require('../middleware/filteredResults');
const {
    getAllSensors,
    createSensor,
    getSensor,
    updateSensor,
    deleteSensor
} = require('../controllers/sensors');
const ErrorResponse = require("../utils/ErrorResponse");

const router = express.Router();
router.use(connectDB, protect);


router.route('/')
    .get(getAuthorization(['admin', 'user']), getAllSensors, filteredResults)
    .post(getAuthorization(['admin', 'user']), checkZone, createSensor)


router.route('/:sensorID')
    .get(getAuthorization(['admin', 'user']), getSensor, filteredResults)
    .put(getAuthorization(['admin', 'user']), updateSensor)
    .delete(getAuthorization(['admin', 'user']), deleteSensor);

module.exports = router;