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
        SELECT COUNT(*) AS founded_sensor, sensor_id
        FROM user_sensors
        WHERE user_id = ? AND name = ?
    `;
    req.query.params = [req.user.user_id, req.body.name];

    const result = (await executeQuery(req.pool, req.query))[0];

    if (result.founded_sensor) return next(new ErrorResponse(`User already had registered a sensor with name ${req.body.name} --> ${result.sensor_id}`, 400));

    req.query.sql = `
            INSERT INTO sensors(name, enabled, triggered, zone)
            VALUES (?, ?, ?, ?)
            `;

    const enabled = req.body.enabled || true;
    const triggered = req.body.triggered || false;

    req.query.params = [req.body.name, enabled, triggered, req.body.zone];

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

    const {
        triggered = sensor.triggered,flag= "arduino"
    } = {...req.body};

    req.query.sql = `
        SELECT COUNT(*) AS founded_sensor
        FROM user_sensors
        WHERE user_id = ? AND name = ? AND sensor_id !=  ? 
    `;

    req.query.params = [req.user.user_id, name, req.params.sensorID]

    const isFounded = (await executeQuery(req.pool, req.query))[0].founded_sensor;

    if (isFounded) return next(new ErrorResponse(`Is not possible to change name in ${name}: User already had registered a sensor with this one`, 400));

    req.query.sql = `
    UPDATE sensors
    SET 
        triggered = ?,
        flag = ?
    WHERE id = ?;
`;

    req.query.params = [enabled, triggered,flag , req.params.sensorID];

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
