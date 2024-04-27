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
    .put(getAuthorization(['admin', 'user']), async (req, res, next) => {
        req.query.sql = `
        SELECT *
        FROM user_sensors
        WHERE user_id = ? AND sensor_id = ? 
    `
        req.query.params = [req.user.user_id, req.params.sensorID]
        const sensor = (await executeQuery(req.pool, req.query))[0];

        if (!sensor) return next(new ErrorResponse('Could not find sensor', 400));

        const {
            name = sensor.name, enabled = sensor.enabled, triggered = sensor.triggered, zone = sensor.zone,flag= "arduino"
        } = {...req.body};
    }, checkZone, updateSensor)
    .delete(getAuthorization(['admin', 'user']), deleteSensor);

module.exports = router;