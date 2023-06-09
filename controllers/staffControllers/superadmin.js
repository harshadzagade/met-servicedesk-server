const Staff = require("../../models/staff");
const bcrypt = require('bcryptjs');
const Trash = require("../../models/trash");
const { getStaffDetailsCommon } = require("../../utils/functions");

exports.getSuperAdmin = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role !== 'superadmin') {
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

exports.createStaff = async (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const department = req.body.department;
    try {
        const isEmailExist = await Staff.findOne({
            where: {
                email: email
            }
        });
        if (isEmailExist) {
            const error = new Error('E-Mail already exists');
            error.statusCode = 409;
            throw error;
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const staff = new Staff({
            name: name,
            email: email,
            password: hashedPassword,
            role: 'user',
            department: department,
            isNew: true
        });
        const result = await staff.save();
        res.status(201).json({ message: 'Staff created!', staffId: result.id });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getAllStaff = async (req, res, next) => {
    try {
        const totalStaff = await Staff.findAll();
        let excludeSuper = totalStaff;
        excludeSuper.shift();
        res.status(200).json({ message: 'Fetched all staff successfully.', totalStaff: excludeSuper });
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
    const name = req.body.name;
    const email = req.body.email;
    const role = req.body.role;
    const department = req.body.department;
    try {
        const isEmailExist = await Staff.findOne({
            where: {
                email: email
            }
        });
        console.log(isEmailExist.email);
        const staff = await Staff.findByPk(staffId);
        console.log(staff.email);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (isEmailExist.email !== staff.email) {
            const error = new Error('E-Mail already exists');
            error.statusCode = 409;
            throw error;
        }
        staff.name = name;
        staff.email = email;
        staff.role = role;
        staff.department = department;
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

exports.deleteStaff = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        const id = staffId;
        const name = staff.name;
        const email = staff.email;
        const password = staff.password;
        const role = staff.role;
        const department = staff.department;
        const isNew = staff.isNew;
        const trash = new Trash({
            id: id,
            name: name,
            email: email,
            password: password,
            role: role,
            department: department,
            isNew: isNew
        });
        const result = await trash.save();
        res.status(201).json({ message: 'Staff added to trash.', staffId: result.id });
        await staff.destroy();
        await staff.save();
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};