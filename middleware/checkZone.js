const ErrorResponse = require('../utils/ErrorResponse');
const {executeQuery} = require('../utils/query');

const checkZone = async (req, res, next) => {
    if (!req.body.zone)
        return next(new ErrorResponse('Please enter a valid zone'));
    req.query.params = [req.user.user_id, req.body.zone];

    console.log(req.user);
    req.query.sql = `
        SELECT COUNT(*) AS founded_zones
        FROM user_zones
        WHERE user_id = ? AND zone_id = ?
    `;

    const result = (await executeQuery(req.pool, req.query))[0];

    if (!result.founded_zones) {
        return next(new ErrorResponse('Could not find zone', 400));
    }

    console.log("AUTORIZZATO DA CHECKZONE");
    next();
}

module.exports = checkZone;