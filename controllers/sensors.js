const ErrorResponse = require('../utils/ErrorResponse');
const {executeQuery} = require('../utils/query')
const {query} = require("express");

exports.getAllSensors = async (req, res, next) => {
    req.query.sql = `
        SELECT *
        FROM user_sensors
        WHERE user_id = ?
  `;

    req.query.params = req.user.user_id;

    const results = await executeQuery(req.pool, req.query);
    req.query.json = results;

    next();

};

exports.createSensor = async (req, res, next) => {
    if (!req.body.name || !req.body.zone) {
        return next(new Error('Please provide both name and zone'));
    }

    req.query.sql = `
        SELECT sensor_id
        FROM user_sensors
        WHERE user_id = ? AND name = ?
    `;

    req.query.params = [req.user.user_id , req.body.name];
    console.log(req.query.params)

    const result = (await executeQuery(req.pool, req.query))[0];

    if (result) {
        console.log("SENSORS: " + JSON.stringify(result));
        console.log(result.sensor_id[0]);
        return next(new ErrorResponse(`User already had registered a sensor with name ${req.body.name} --> ${result.sensor_id}`, 400));
    }
    req.query.sql = `
            INSERT INTO sensors(name, enabled, triggered, zone)
            VALUES (?, ?, ?, ?)
            `;

    const enabled = req.body.enabled || 1;
    const triggered = req.body.triggered || 0

    req.query.params = [req.body.name, enabled, triggered, req.body.zone];
    console.log("sono qui");
    const results = await executeQuery(req.pool, req.query)

    res.status(200).json({
        success: true
    });
};


exports.getSensor = async (req, res, next) => {
    req.query.sql = `
        SELECT *
        FROM user_sensors
        WHERE user_id = ? AND sensor_id= ?;
  `;
    req.query.params = [req.user.user_id, req.params.sensorID]

    const results = await executeQuery(req.pool, req.query);

    req.query.json = results;
    next();
}


exports.updateSensor = async (req, res, next) => {
    req.query.sql = `
        SELECT *
        FROM user_sensors
        WHERE user_id = ? AND sensor_id = ? 
    `

    req.query.params = [req.user.user_id, req.params.sensorID]
    const sensor = (await executeQuery(req.pool, req.query))[0];

    if (!sensor) return next(new ErrorResponse('Could not find sensor', 400));

    console.log(JSON.stringify(sensor));

    const {
        triggered = sensor.triggered,flag = "arduino"
    } = {...req.body};


    req.query.sql = `
    UPDATE sensors
    SET 
        triggered = ?,
        flag = ?
    WHERE id = ?;
    `;

    req.query.params = [triggered,flag , req.params.sensorID];
    console.log(req.query.params);

    console.log(req.pool, JSON.stringify(req.query));
    await executeQuery(req.pool, req.query);

    res.status(200).json({success: true})
}

exports.deleteSensor = async (req, res, next) => {


    try {
        req.query.sql = `
        DELETE FROM sensorslogs 
        USING sensorslogs 
        INNER JOIN sensors ON sensors.id = sensorslogs.sensor
        WHERE sensors.id = ?;
    `;

        req.query.params = req.params.sensorID;
        await executeQuery(req.pool, req.query);

        req.query.sql = `
        DELETE FROM sensors 
        WHERE id = ?;
    `;
        await executeQuery(req.pool, req.query);
        res.status(200).json({success: true, message: "Sensor and related logs deleted successfully."});
    } catch (err) {
        return next(new ErrorResponse("Failed to delete sensor: " + err.message, 400));
    }
}
