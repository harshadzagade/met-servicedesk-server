const Staff = require("../models/staff");
const bcrypt = require('bcryptjs');

const getStaffDetailsCommon = async (staffId, res, next) => {
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Staff fetched.', staff: staff });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const resetPasswordCommon = async (res, next, email, newPassword) => {
    try {
        const staff = await Staff.findOne({
            where: { email: email }
        });
        if (!staff) {
            const error = new Error('Staff not found.');
            error.statusCode = 401;
            throw error;
        }
        staff.password = await bcrypt.hash(newPassword, 12);
        const result = await staff.save();
        res.status(200).json({ message: 'New password set syccessfully!', staff: result });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getDepartments = async () => {
    const totalStaff = await Staff.findAll();
    let allDept = [];
    totalStaff.map((staff, i, row) => {
        const department = staff.department;
        allDept = allDept.concat(department);
    });
    const departments = allDept;
    const uniqueDepartments = departments.filter(function(item, position) {
        return departments.indexOf(item) == position;
    })
    return uniqueDepartments;
};

exports.getStaffDetailsCommon = getStaffDetailsCommon;

exports.resetPasswordCommon = resetPasswordCommon;

exports.getDepartments = getDepartments;