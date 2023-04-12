const Request = require('../models/request');
const Staff = require('../models/staff');

exports.sendRequest = async (req, res, next) => {
    const staffId = req.body.staffId;
    const behalf = req.body.behalf || false;
    let behalfId = null;
    const department = req.body.department;
    const category = req.body.category;
    const priority = req.body.priority;
    const subject = req.body.subject;
    const description = req.body.description;
    try {
        if (behalf) {
            behalfId = req.body.behalfId;
        }
        const request = new Request({
            staffId: staffId,
            status: 'pending',
            behalf: behalf,
            behalfId: behalfId,
            department: department,
            category: category,
            priority: priority,
            subject: subject,
            description: description,
            approval1: false,
            approval2: false
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
                        department: singleDepartment
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