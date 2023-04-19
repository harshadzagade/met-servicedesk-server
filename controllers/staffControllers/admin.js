const Staff = require("../../models/staff");
const { getStaffDetailsCommon } = require("../../utils/functions");
const { getRequestsToDepartment, getRequestsFromDepartment } = require("../request");
const { getComplaintsFromDepartment, getComplaintsToDepartment } = require("../complaint");
const Request = require("../../models/request");

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
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
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
        const requests = await getRequestsFromDepartment(staff.department, next);
        res.status(200).json({ message: 'Fetched all requests successfully.', requests: requests });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getIncomingRequests = async (req, res, next) => {
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
        const requests = await getRequestsToDepartment(staff.department, next);
        res.status(200).json({ message: 'Fetched all requests successfully.', requests: requests });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getOutgoingComplaints = async (req, res, next) => {
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
        const complaints = await getComplaintsFromDepartment(staff.department, next);
        res.status(200).json({ message: 'Fetched all complaints successfully.', complaints: complaints });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.putApproval1 = async (req, res, next) => {
    const requestId = req.params.requestId;
    const approval = req.body.approval;
    try {
        const request = await Request.findByPk(requestId);
        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 401;
            throw error;
        }
        if (!approval) {
            const error = new Error('Either approve or disapprove the request');
            error.statusCode = 401;
            throw error;
        }
        if (approval === 1) {
            request.approval1 = 1;
            request.status = 'pending';
        } else if (approval === 2) {
            request.approval1 = 2;
            request.status = 'disapproved';
        }
        const result = await request.save();
        res.status(200).json({ message: 'Staff details updated', request: result });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.putApproval2 = async (req, res, next) => {
    const requestId = req.params.requestId;
    let staffId = null;
    const approval = req.body.approval;
    try {
        const request = await Request.findByPk(requestId);
        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 401;
            throw error;
        }
        if (!request.approval1) {
            const error = new Error('No approval from department admin');
            error.statusCode = 401;
            throw error;
        }
        if (!approval) {
            const error = new Error('Either approve or disapprove the request');
            error.statusCode = 401;
            throw error;
        }
        if (approval === 1) {
            staffId = req.body.staffId;
            const staff = await Staff.findByPk(staffId);
            if (!staff) {
                const error = new Error('Staff not found');
                error.statusCode = 401;
                throw error;
            }
            if (staff.role !== 'technician') {
                const error = new Error('Staff is not a technician');
                error.statusCode = 401;
                throw error;
            }
            if (staff.department !== request.department) {
                const error = new Error('Not assigned department staff');
                error.statusCode = 401;
                throw error;
            }
            request.approval2 = 1;
            request.assign = staffId;
            request.status = 'assigned';
        } else if (approval === 2) {
            request.approval2 = 2;
            request.assign = null;
            request.status = 'disapproved';
        }
        const result = await request.save();
        res.status(200).json({ message: 'Staff details updated', request: result });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};