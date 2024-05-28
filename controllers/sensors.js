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
    try {
        req.query.sql = `
            SELECT *
            FROM user_sensors
            WHERE user_id = ? AND sensor_id = ?;
        `;
        req.query.params = [req.user.user_id, req.params.sensorID];

        const sensorResult = await executeQuery(req.pool, req.query);
        const sensor = sensorResult[0];

        if (!sensor) {
            return next(new ErrorResponse('Could not find sensor', 400));
        }

        const {
            triggered = sensor.triggered,
            flag = sensor.flag,
            enabled = sensor.enabled,
            name = sensor.name
        } = { ...req.body };

        if (flag == null) {
            return next(new ErrorResponse('Flag cannot be null', 400));
        }

        req.query.sql = `
            UPDATE sensors
            SET 
                triggered = ?,
                flag = ?,
                enabled = ?,
                name = ?
            WHERE id = ?;
        `;
        req.query.params = [triggered, flag, enabled, name, req.params.sensorID];
        await executeQuery(req.pool, req.query);

        const logQueries = [];

        if (sensor.triggered !== triggered) {
            const type = (triggered === 1) ? 3 : 4;
            logQueries.push({
                sql: `
                    INSERT INTO sensorslogs(type, sensor, user)
                    VALUES(?, ?, ?);
                `,
                params: [type, req.params.sensorID, req.user.user_id]
            });
        }

        if (sensor.flag !== flag) {
            const type = (flag === 'arduino') ? 5 : 6;
            logQueries.push({
                sql: `
                    INSERT INTO sensorslogs(type, sensor, user)
                    VALUES(?, ?, ?);
                `,
                params: [type, req.params.sensorID, req.user.user_id]
            });
        }

        if (sensor.enabled !== enabled) {
            const type = (enabled === 1) ? 1 : 2;
            logQueries.push({
                sql: `
                    INSERT INTO sensorslogs(type, sensor, user)
                    VALUES(?, ?, ?);
                `,
                params: [type, req.params.sensorID, req.user.user_id]
            });
        }

        if (sensor.name !== name) {
            const type = 7;
            logQueries.push({
                sql: `
                    INSERT INTO sensorslogs(type, sensor, user)
                    VALUES(?, ?, ?);
                `,
                params: [type, req.params.sensorID, req.user.user_id]
            });
        }

        for (const logQuery of logQueries) {
            req.query.sql = logQuery.sql;
            req.query.params = logQuery.params;
            await executeQuery(req.pool, req.query);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};

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
