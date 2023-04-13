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

exports.changeRequestStatus = async (req, res, next) => {
    const requestId = req.params.requestId;
    const statusChange = req.body.status;
    try {
        const request = await Request.findByPk(requestId);
        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 401;
            throw error;
        }
        let assign = request.assign;
        const staff = await Staff.findByPk(assign);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.department !== request.department) {
            const error = new Error('Staff does not belong to expected department');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role !== 'technician') {
            const error = new Error('Staff other than technicians cannot forward requests');
            error.statusCode = 401;
            throw error;
        }
        switch (statusChange) {
            case 'closed':
                request.status = 'closed';
                break;

            case 'completed':
                request.status = 'completed';
                break;

            case 'forwarded':
                request.status = 'forwarded';
                assign = req.body.assign;
                if (request.assign === assign) {
                    const error = new Error('Same staff is already assigned');
                    error.statusCode = 401;
                    throw error;
                }
                const staff = await Staff.findByPk(assign);
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
                    const error = new Error('Staff does not belong to expected department');
                    error.statusCode = 401;
                    throw error;
                }
                if (assign) {
                    request.assign = assign;
                } else {
                    const error = new Error('Forwarded staff not found');
                    error.statusCode = 401;
                    throw error;
                }
                break;

            default:
                const error = new Error('Invalid status input');
                error.statusCode = 401;
                throw error;
        }
        const result = await request.save();
        res.status(200).json({ message: 'status updated successfully!', request: result });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};