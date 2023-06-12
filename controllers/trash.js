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
        const lastname = trashStaff.lastname;
        const email = trashStaff.email;
        const password = trashStaff.password;
        const role = trashStaff.role;
        const department = trashStaff.department;
        const phoneNumber = trashStaff.phoneNumber;
        const contactExtension = trashStaff.contactExtension;
        const isNew = trashStaff.isNew;
        const staff = new Staff({
            id: trashStaffId,
            firstname: firstname,
            lastname: lastname,
            email: email,
            password: password,
            role: role,
            department: department,
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
                    lastname: staff.lastname,
                    email: staff.email,
                    password: staff.password,
                    role: staff.role,
                    department: staff.department,
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
        res.status(200).json({ message: 'Staff restrored successfully.', staff: trashStaff });
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

exports.getTrashStaffDepartments = async (req, res, next) => {
    const totalStaff = await Trash.findAll({ where: { id: { [Op.ne]: 1 } } });
    let allDept = [];
    totalStaff.map((staff) => {
        const department = staff.department;
        allDept = allDept.concat(department);
    });
    const allDepartments = allDept;
    const uniqueDepartments = allDepartments.filter(function(item, position) {
        return allDepartments.indexOf(item) == position;
    })
    const departments = uniqueDepartments;
    res.status(200).json({ message: 'Fetched departments!', departments: departments });
};

exports.getTrashStaffByDepartment = async (req, res, next) => {
    const department = req.params.department;
    try {
        const staff = await Trash.findAll({
            where: {
                department: {
                    [Op.contains]: [department]
                }
            }
        });
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Departments fetched successfully', staff: staff });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};