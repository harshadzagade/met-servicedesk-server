const Request = require('../models/request');
const Staff = require('../models/staff');
const Op = require('sequelize').Op;
const upload = require('../middleware/uploadfiles');

exports.sendRequest = async (req, res, next) => {
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
        const request = new Request({
            staffId: staffId,
            behalf: behalf,
            behalfId: behalfId,
            name: staff.lastname === ''? staff.firstname : staff.firstname + ' ' + staff.lastname,
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
        const result = await request.save();
        res.status(201).json({ message: 'Staff created!', request: result });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getAllRequests = async (req, res, next) => {
    try {
        const requests = await Request.findAll();
        res.status(200).json({ message: 'Fetched all requests successfully.', requests: requests });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getRequestsFromDepartment = async (department, next) => {
    try {
        let staffs = [];
        if (department.includes(',')) {
            const departments = department.split(',');
            for (let j = 0; j < departments.length; j++) {
                const department = departments[j];
                const staff = await Staff.findAll({
                    where: {
                        department: department
                    }
                });
                staffs = staffs.concat(staff);
            }
        } else {
            const staff = await Staff.findAll({
                where: {
                    department: department
                }
            });
            staffs = staff;
        }
        let allRequests = [];
        for (let i = 0; i < staffs.length; i++) {
            const singleStaff = staffs[i];
            const requests = await Request.findAll({
                where: {
                    staffId: singleStaff.id
                }
            });
            allRequests = allRequests.concat(requests);
        }
        return allRequests;
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getRequestsToDepartment = async (department, next) => {
    try {
        if (department.includes(',')) {
            let departments;
            let multipleDepartmentsRequests = [];
            departments = department.split(',');
            for (let i = 0; i < departments.length; i++) {
                const singleDepartment = departments[i];
                const requests = await Request.findAll({
                    where: {
                        department: singleDepartment,
                        approval1: true
                    }
                });
                multipleDepartmentsRequests = multipleDepartmentsRequests.concat(requests);
            }
            return multipleDepartmentsRequests;
        }
        const requests = await Request.findAll({
            where: {
                department: department
            }
        });
        return requests;
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.ownRequests = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        const requests = await Request.findAll({
            where: {
                [Op.or]: [
                    { staffId: staffId },
                    { category: 'general' }
                ]
            }
        });
        res.status(200).json({ message: 'Staff created!', requests: requests });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getRequestDetails = async (req, res, next) => {
    const requestId = req.params.requestId;
    try {
        const request = await Request.findByPk(requestId);
        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Request fetched successfully!', request: request });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};