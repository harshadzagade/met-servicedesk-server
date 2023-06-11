const Report = require("../models/report");

exports.getFullReport = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const report = await Report.findAll({ where: { staffId: staffId } });
        res.status(200).json({ message: 'Fetched report successfully.', report: report });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getRequestReport = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const report = await Report.findAll({ where: { staffId: staffId, isRequest: true, isComplaint: false } });
        res.status(200).json({ message: 'Fetched report successfully.', report: report });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getComplaintReport = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const report = await Report.findAll({ where: { staffId: staffId, isRequest: false, isComplaint: true } });
        res.status(200).json({ message: 'Fetched report successfully.', report: report });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getReportDetails = async (req, res, next) => {
    const reportId = req.params.reportId;
    try {
        const report = await Report.findByPk(reportId);
        if (!report) {
            const error = new Error('Report not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Report fetched successfully', report: report });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};