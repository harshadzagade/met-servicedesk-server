const Report = require("../models/report");

exports.getFullReport = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const report = await Report.findAll({ where: { staffId: staffId } });
        res.status(200).json({ message: 'Fetched report successfully.', report: report });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getRequestReport = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const report = await Report.findAll({ where: { staffId: staffId, isRequest: true, isComplaint: false } });
        res.status(200).json({ message: 'Fetched report successfully.', report: report });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getComplaintReport = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const report = await Report.findAll({ where: { staffId: staffId, isRequest: false, isComplaint: true } });
        res.status(200).json({ message: 'Fetched report successfully.', report: report });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};