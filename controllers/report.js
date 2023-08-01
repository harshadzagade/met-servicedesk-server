const { Parser } = require("json2csv");
const Report = require("../models/report");
const Staff = require("../models/staff");

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

exports.getReportCategories = async (req, res, next) => {
    const allReports = await Report.findAll();
    let allCategory = [];
    allReports.map((report) => {
        const category = report.category;
        allCategory.push(category);
    });
    const allCategories = allCategory;
    const uniqueCategories = allCategories.filter(function (item, position) {
        return allCategories.indexOf(item) == position;
    })
    const categories = uniqueCategories;
    res.status(200).json({ message: 'Fetched categories', categories: categories });
};

exports.getReportByCategory = async (req, res, next) => {
    const category = req.params.category;
    try {
        const report = await Report.findAll({
            where: {
                category: category
            }
        });
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

exports.getReportByPriority = async (req, res, next) => {
    const priority = req.params.priority;
    try {
        const report = await Report.findAll({
            where: {
                priority: priority
            }
        });
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

exports.getReportByStaff = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const report = await Report.findOne({
            where: {
                staffId: staffId
            }
        });
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

exports.getReportCsv = async (req, res, next) => {
    const reportData = req.body.reportData;
    const fields = [
        'id',
        'isRequest',
        'isComplaint',
        'requestComplaintId',
        'staffId',
        'staffName',
        'assignedName',
        'category',
        'priority',
        'subject',
        'description',
        'department',
        'staffDepartment',
        'status',
        'loggedTime',
        'approval1Time',
        'approval1Duration',
        'approval2Time',
        'assignedTime',
        'assignDuration',
        'attendedTime',
        'attendDuration',
        'lastUpdatedTime',
        'lastUpdateDuration',
        'problemDescription',
        'actionTaken',
        'createdAt',
        'updatedAt'
    ];
    const json2csv = new Parser({ fields });
    try {
        const csv = json2csv.parse(reportData);
        res.setHeader('Content-disposition', 'attachment; filename=data.csv');
        res.set('Content-Type', 'text/csv');
        res.status(200).send(csv);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};