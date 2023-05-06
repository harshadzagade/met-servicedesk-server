const Report = require("../models/report");

exports.getFullReport = async (req, res, next) => {
    try {
        const report = await Report.findAll();
        res.status(200).json({ message: 'Fetched report successfully.', report: report });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};