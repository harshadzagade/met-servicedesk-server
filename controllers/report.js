const { Parser } = require("json2csv");
const Report = require("../models/report");
const Department = require("../models/department");

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

/* exports.getDepartmentReport = async (req, res, next) => {
    const department = req.params.department;
    try {
        const report = await Report.findAll({ where: { department: department } });
        res.status(200).json({ message: 'Fetched report successfully.', report: report });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}; */

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
    const departmentName = req.params.department;
    try {
        const department = await Department.findOne({
            where: {
                department: departmentName
            }
        });
        if (!department) {
            const error = new Error('Department not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Fetched categories', categories: department.category });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getReportByCategory = async (req, res, next) => {
    const category = req.params.category;
    const technicianId = req.params.technicianId;
    try {
        const report = await Report.findAll({
            where: {
                category: category,
                assignId: technicianId
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
    const technicianId = req.params.technicianId;
    try {
        const report = await Report.findAll({
            where: {
                priority: priority,
                assignId: technicianId
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
            'Ticket Type': singleReport.isRequest ? 'Request' : 'Complaint',
            'Ticket ID': singleReport.ticketId,
            'Ticket raised by': singleReport.staffName,
            'Engineer Name': singleReport.assignedName,
            'From Department': singleReport.staffDepartment,
            'To Department': singleReport.department,
            'User Type': singleReport.departmentType,
            'Institute': singleReport.institute,
            'Category': singleReport.category,
            'Priority': singleReport.priority,
            'Subject': singleReport.subject,
            'Description': singleReport.description,
            'C/R Status': singleReport.status,
            'Logged Time': getFormattedDate(singleReport.loggedTime),
            'Assigned Time': getFormattedDate(singleReport.assignedTime),
            'Assign Duration (HH:MM:SS)': getReportDuration(singleReport.assignDuration),
            'Attending Time': getFormattedDate(singleReport.attendedTime),
            'Attend Duration (HH:MM:SS)': getReportDuration(singleReport.attendDuration),
            'Last Updated Time': getFormattedDate(singleReport.lastUpdatedTime),
            'Last Updated Duration (HH:MM:SS)': getReportDuration(singleReport.lastUpdateDuration),
            'Problem Description': singleReport.problemDescription,
            'Action Taken': singleReport.actionTaken,
            'HOD Approval Status': singleReport.approval1Status,
            'HOD Approval Time': getFormattedDate(singleReport.approval1Time),
            'HOD Approval Comment': singleReport.approval1Comment,
            'HOD Approval Duration (HH:MM:SS)': getReportDuration(singleReport.approval1Duration),
            'Admin Approval Status': singleReport.approval2Status,
            'Admin Approval Time': getFormattedDate(singleReport.approval2Time),
            'Admin Approval Comment': singleReport.approval2Comment
        };
    });
    const fields = [
        'Ticket Type',
        'Ticket ID',
        'Ticket raised by',
        'Engineer Name',
        'From Department',
        'To Department',
        'User Type',
        'Institute',
        'Category',
        'Priority',
        'Subject',
        'Description',
        'C/R Status',
        'Logged Time',
        'Assigned Time',
        'Assign Duration (HH:MM:SS)',
        'Attending Time',
        'Attend Duration (HH:MM:SS)',
        'Last Updated Time',
        'Last Updated Duration (HH:MM:SS)',
        'Problem Description',
        'Action Taken',
        'HOD Approval Status',
        'HOD Approval Time',
        'HOD Approval Comment',
        'HOD Approval Duration (HH:MM:SS)',
        'Admin Approval Status',
        'Admin Approval Time',
        'Admin Approval Comment'
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
    const seconds = Math.floor(duration / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}