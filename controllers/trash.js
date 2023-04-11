const Staff = require("../models/staff");
const Trash = require("../models/trash");

exports.getAllStaff = async (req, res, next) => {
    try {
        const allStaff = await Trash.findAll();
        res.status(200).json({ message: 'All staff fetched successfully!', allStaff: allStaff })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getStaffDetails = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Trash.findByPk(staffId);
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

exports.restoreStaff = async (req, res, next) => {
    const trashStaffId = req.params.staffId;
    try {
        const trashStaff = await Trash.findByPk(trashStaffId);
        if (!trashStaff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        const name = trashStaff.name;
        const email = trashStaff.email;
        const password = trashStaff.password;
        const role = trashStaff.role;
        const department = trashStaff.department;
        const isNew = trashStaff.isNew;
        const staff = new Staff({
            id: trashStaffId,
            name: name,
            email: email,
            password: password,
            role: role,
            department: department,
            isNew: isNew
        });
        await staff.save();
        await trashStaff.destroy();
        await trashStaff.save();
        res.status(200).json({ message: 'Staff restrored successfully.', staff: staff });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.restoreAllStaff = async (req, res, next) => {
    try {
        const trashStaff = await Trash.findAll();
        const records = [];
        for (let index = 0; index < trashStaff.length; index++) {
            const staff = await Trash.findOne({ where: { id: trashStaff[index].id } })
            records.push({ id: staff.id, name: staff.name, email: staff.email, password: staff.password, role: staff.role, department: staff.department, createdAt: staff.createdAt, updatedAt: staff.updatedAt });
        }
        const allStaff = await Staff.bulkCreate(records);
        await Trash.destroy({ truncate : true, cascade: true });
        res.status(200).json({ message: 'All staff restored successfully!', allStaff: allStaff })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.removeStaff = async (req, res, next) => {
    const trashStaffId = req.params.staffId;
    try {
        const trashStaff = await Trash.findByPk(trashStaffId);
        if (!trashStaff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        await trashStaff.destroy();
        await trashStaff.save();
        res.status(200).json({ message: 'Staff restrored successfully.', staff: trashStaff });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.removeAllStaff = async (req, res, next) => {
    try {
        const allStaff = await Trash.destroy({ truncate: true, cascade: true });
        res.status(200).json({ message: 'All staff deleted successfully!', allStaff: allStaff })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};