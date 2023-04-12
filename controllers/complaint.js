const Complaint = require('../models/complaint');
const Staff = require('../models/staff');

exports.sendComplaint = async (req, res, next) => {
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
        const complaint = new Complaint({
            staffId: staffId,
            status: 'pending',
            behalf: behalf,
            behalfId: behalfId,
            department: department,
            category: category,
            priority: priority,
            subject: subject,
            description: description
        });
        const result = await complaint.save();
        res.status(201).json({ message: 'Staff created!', complaint: result });
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

exports.getComplaintsToDepartment = async (department, next) => {
    try {
        if (department.includes(',')) {
            let departments;
            let multipleDepartmentsComplaints = [];
            departments = department.split(',');
            for (let i = 0; i < departments.length; i++) {
                const singleDepartment = departments[i];
                const complaints = await Complaint.findAll({
                    where: {
                        department: singleDepartment
                    }
                });
                multipleDepartmentsComplaints = multipleDepartmentsComplaints.concat(complaints);
            }
            return multipleDepartmentsComplaints;
        }
        const complaints = await Complaint.findAll({
            where: {
                department: department
            }
        });
        return complaints;
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
        const staff = await Complaint.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        const complaints = await Complaint.findAll({
            where: {
                staffId: staffId
            }
        });
        if (!complaints) {
            const error = new Error('No complaints found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Staff created!', complaints: complaints });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};