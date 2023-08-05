const Staff = require("../models/staff");
const Trash = require("../models/trash");
const Op = require('sequelize').Op;

exports.getAllStaff = async (req, res, next) => {
    try {
        const allStaff = await Trash.findAll();
        res.status(200).json({ message: 'All staff fetched successfully!', allStaff: allStaff })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
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
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
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
        const firstname = trashStaff.firstname;
        const middlename = trashStaff.middlename;
        const lastname = trashStaff.lastname;
        const email = trashStaff.email;
        const password = trashStaff.password;
        const role = trashStaff.role;
        const institute = trashStaff.institute;
        const department = trashStaff.department;
        const departmentType = trashStaff.departmentType;
        const phoneNumber = trashStaff.phoneNumber;
        const contactExtension = trashStaff.contactExtension;
        const isNew = trashStaff.isNew;
        const staff = new Staff({
            id: trashStaffId,
            firstname: firstname,
            middlename: middlename,
            lastname: lastname,
            email: email,
            password: password,
            role: role,
            institute: institute,
            department: department,
            departmentType: departmentType,
            phoneNumber: phoneNumber,
            contactExtension: contactExtension,
            isNew: isNew
        });
        await staff.save();
        await trashStaff.destroy();
        await trashStaff.save();
        res.status(200).json({ message: 'Staff restrored successfully.', staff: staff });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.restoreAllStaff = async (req, res, next) => {
    try {
        const trashStaff = await Trash.findAll();
        const records = [];
        for (let index = 0; index < trashStaff.length; index++) {
            const staff = await Trash.findOne({ where: { id: trashStaff[index].id } });
            records.push(
                {
                    id: staff.id,
                    firstname: staff.firstname,
                    middlename: staff.middlename,
                    lastname: staff.lastname,
                    email: staff.email,
                    password: staff.password,
                    role: staff.role,
                    institute: staff.institute,
                    department: staff.department,
                    departmentType: staff.departmentType,
                    phoneNumber: staff.phoneNumber,
                    contactExtension: staff.contactExtension,
                    isNew: false,
                    createdAt: staff.createdAt,
                    updatedAt: staff.updatedAt
                }
            );
        }
        const allStaff = await Staff.bulkCreate(records);
        await Trash.destroy({ truncate: true, cascade: true });
        res.status(200).json({ message: 'All staff restored successfully!', allStaff: allStaff })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
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
        res.status(200).json({ message: 'Staff deleted successfully.', staff: trashStaff });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.removeAllStaff = async (req, res, next) => {
    try {
        const allStaff = await Trash.destroy({ truncate: true, cascade: true });
        res.status(200).json({ message: 'All staff deleted successfully!', allStaff: allStaff });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};