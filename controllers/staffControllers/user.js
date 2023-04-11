const Staff = require("../../models/staff");
const { getDepartments } = require("../../utils/functions");

exports.getUser = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const departments = await getDepartments();
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role !== 'user') {
            const error = new Error('Unauthorised staff');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Staff verification successful!', staffId: staff.id, departments: departments })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};