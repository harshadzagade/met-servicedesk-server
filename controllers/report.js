const { Parser } = require("json2csv");
const Report = require("../models/report");

exports.getFullReport = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const report = await Report.findAll({ where: { assignId: staffId } });
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
        const report = await Report.findAll({ where: { assignId: staffId, isRequest: true, isComplaint: false } });
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
        const report = await Report.findAll({ where: { assignId: staffId, isRequest: false, isComplaint: true } });
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

exports.getReportCsv = async (req, res, next) => {
    const reportData = req.body.reportData;
    let filteredData = reportData.map((singleReport) => {
        return {
            ...singleReport,
            approval1Duration: getReportDuration(singleReport.approval1Duration),
            assignDuration: getReportDuration(singleReport.assignDuration),
            attendDuration: getReportDuration(singleReport.attendDuration),
            lastUpdateDuration: getReportDuration(singleReport.lastUpdateDuration),
            loggedTime: getFormattedDate(singleReport.loggedTime),
            approval1Time: getFormattedDate(singleReport.approval1Time),
            approval2Time: getFormattedDate(singleReport.approval2Time),
            assignedTime: getFormattedDate(singleReport.assignedTime),
            attendedTime: getFormattedDate(singleReport.attendedTime),
            lastUpdatedTime: getFormattedDate(singleReport.lastUpdatedTime),
            createdAt: getFormattedDate(singleReport.createdAt),
            updatedAt: getFormattedDate(singleReport.updatedAt)
        };
    });
    const fields = [
        'id',
        'isRequest',
        'isComplaint',
        'requestComplaintId',
        'staffName',
        'assignId',
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
        const csv = json2csv.parse(filteredData);
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

const getFormattedDate = (rawDate) => {
    if (rawDate === null) {
        return null;
    }
    const date = new Date(rawDate);
    return (date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + formatAMPM(date));
};

const formatAMPM = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    let strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
    return strTime;
};

const getReportDuration = (duration) => {
    if (duration === null) {
        return null;
    }
    const assignDuration = duration;
    let diffHrs = Math.floor((assignDuration % 86400000) / 3600000);
    let diffMins = Math.round(((assignDuration % 86400000) % 3600000) / 60000);
    return (diffHrs + ' Hours and ' + diffMins + ' Minutes');
}