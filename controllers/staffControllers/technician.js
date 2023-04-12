const Staff = require("../../models/staff");
const { getComplaintsFromDepartment } = require("../complaint");
const { getRequestsFromDepartment } = require("../request");

exports.getTechnician = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role !== 'technician') {
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

exports.getOutgoingRequests = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role !== 'technician') {
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

exports.getOutgoingComplaints = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role !== 'technician') {
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
}