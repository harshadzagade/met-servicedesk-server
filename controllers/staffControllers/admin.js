const Staff = require("../../models/staff");
const { getStaffDetailsCommon } = require("../../utils/functions");
const { getRequestsToDepartment, getRequestsFromDepartment } = require("../request");

exports.getAdmin = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role !== 'admin') {
            const error = new Error('Unauthorised staff');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Staff verification successful!', staffId: staff.id })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getAllStaff = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (staff.role === 'admin') {
            const dept = staff.department.split(',');
            const totalStaff = await Staff.findAll({ where: { department: dept } });
            let excludeAdmin = totalStaff;
            excludeAdmin.shift();
            res.status(200).json({ message: 'Fetched all staff as per specific department successfully.', totalStaff: excludeAdmin });
        } else {
            const error = new Error('Invalid admin id');
            error.statusCode = 401;
            throw error;
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getStaffDetails = async (req, res, next) => {
    const staffId = req.params.staffId;
    getStaffDetailsCommon(staffId, res, next);
};

exports.updateStaff = async (req, res, next) => {
    const staffId = req.params.staffId;
    const role = req.body.role;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role === 'superadmin' || staff.role === 'admin') {
            const error = new Error('Not allowed to edit role of admin or super-admin');
            error.statusCode = 401;
            throw error;
        }
        staff.role = role;
        if (staff.role === '' || staff.role === null) {
            staff.role = 'user';
            await staff.save();
        }
        const result = await staff.save();
        res.status(200).json({ message: 'Staff details updated', staff: result });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getOutgoingRequests = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        const requests = await getRequestsFromDepartment(staff.department, next);
        res.status(200).json({ message: 'Fetched all requests successfully.', requests: requests });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getIncomingRequests = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        const requests = await getRequestsToDepartment(staff.department, next);
        res.status(200).json({ message: 'Fetched all requests successfully.', requests: requests });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};