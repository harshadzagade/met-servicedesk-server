const Staff = require("../../models/staff");
const Request = require("../../models/request");

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

exports.getAssignedRequests = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const requests = await Request.findAll({
            where: {
                assign: staffId
            }
        });
        res.status(200).json({ message: 'Requests fetched successfully!', requests: requests })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};