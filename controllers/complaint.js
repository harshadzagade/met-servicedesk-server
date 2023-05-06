const Complaint = require('../models/complaint');
const Staff = require('../models/staff');
const Op = require('sequelize').Op;
const upload = require('../middleware/uploadfiles');
const Report = require('../models/report');

exports.sendComplaint = async (req, res, next) => {
    const staffId = req.body.staffId;
    const behalf = req.body.behalf || false;
    let behalfId = null;
    let requestStaffId = staffId;
    const department = req.body.department;
    const category = req.body.category;
    const priority = req.body.priority;
    const subject = req.body.subject;
    const description = req.body.description;
    let files = [];
    const isRepeated = req.body.isRepeated || false;
    try {
        await upload(req, res);
        if (req.files) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i].path.replace("\\", "/");
                files = files.concat(file);
            }
        }
        if (behalf) {
            behalfId = req.body.behalfId;
            requestStaffId = behalfId;
        }
        const staff = await Staff.findByPk(requestStaffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        const complaint = new Complaint({
            staffId: staffId,
            behalf: behalf,
            behalfId: behalfId,
            name: staff.lastname === '' ? staff.firstname : staff.firstname + ' ' + staff.lastname,
            status: 'pending',
            assign: null,
            department: department,
            category: category,
            priority: priority,
            subject: subject,
            description: description,
            attachment: files,
            isRepeated: isRepeated
        });
        const result = await complaint.save();
        res.status(201).json({ message: 'Staff created!', complaint: result });
        const report = new Report({
            isRequest: false,
            isComplaint: true,
            requestComplaintId: result.id,
            staffId: requestStaffId,
            staffName: result.name,
            category: result.category,
            priority: result.priority,
            subject: result.subject,
            description: result.description,
            department: result.department,
            loggedTime: result.createdAt
        });
        await report.save();
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getAllComplaints = async (req, res, next) => {
    try {
        const complaints = await Complaint.findAll();
        res.status(200).json({ message: 'Fetched all requests successfully.', complaints: complaints });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getComplaintsFromDepartment = async (department, next) => {
    try {
        const staffs = await Staff.findAll({
            where: {
                department: department
            }
        });
        let allComplaints = [];
        for (let i = 0; i < staffs.length; i++) {
            const singleStaff = staffs[i];
            const complaints = await Complaint.findAll({
                where: {
                    staffId: singleStaff.id
                }
            });
            allComplaints = allComplaints.concat(complaints);
        }
        return allComplaints;
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.ownComplaints = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        const complaints = await Complaint.findAll({
            where: {
                [Op.or]: [
                    { staffId: staffId },
                    { category: 'general' }
                ]
            }
        });
        res.status(200).json({ message: 'Staff created!', complaints: complaints });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getIncomingComplaints = async (req, res, next) => {
    const department = req.params.department;
    try {
        const complaints = await Complaint.findAll({
            where: {
                department: department
            }
        });
        if (!complaints) {
            const error = new Error('Complaints not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Fetched all requests successfully.', complaints: complaints });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};