const Staff = require("../../models/staff");
const bcrypt = require('bcryptjs');
const Trash = require("../../models/trash");
const { getStaffDetailsCommon } = require("../../utils/functions");
const Op = require('sequelize').Op;

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
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.createStaff = async (req, res, next) => {
    const firstname = req.body.firstname;
    const middlename = req.body.middlename;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const password = req.body.password;
    const institute = req.body.institute;
    const department = req.body.department;
    const departmentType = req.body.departmentType;
    const phoneNumber = req.body.phoneNumber;
    const contactExtension = req.body.contactExtension;
    try {
        if (phoneNumber) {
            if (phoneNumber.toString().length !== 10 || typeof phoneNumber !== "number") {
                const error = new Error('Invalid phone number');
                error.statusCode = 409;
                throw error;
            }
        }
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
            firstname: firstname,
            middlename: middlename,
            lastname: lastname,
            email: email,
            password: hashedPassword,
            role: 'user',
            institute: institute,
            department: department,
            departmentType: departmentType,
            phoneNumber: phoneNumber,
            contactExtension: contactExtension,
            isNew: true
        });
        const result = await staff.save();
        res.status(201).json({ message: 'Staff created!', staffId: result.id });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getAllStaff = async (req, res, next) => {
    try {
        const totalStaff = await Staff.findAll({ where: { id: { [Op.ne]: 1 } } });
        res.status(200).json({ message: 'Fetched all staff successfully.', totalStaff: totalStaff });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getStaffDetails = async (req, res, next) => {
    const staffId = req.params.staffId;
    getStaffDetailsCommon(staffId, res, next);
};

exports.updateStaff = async (req, res, next) => {
    const staffId = req.params.staffId;
    const firstname = req.body.firstname;
    const middlename = req.body.middlename;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const role = req.body.role;
    const institute = req.body.institute;
    const department = req.body.department;
    const departmentType = req.body.departmentType;
    const phoneNumber = req.body.phoneNumber;
    const contactExtension = req.body.contactExtension;
    try {
        if (phoneNumber) {
            if (phoneNumber.toString().length !== 10 || typeof phoneNumber !== "number") {
                const error = new Error('Invalid phone number');
                error.statusCode = 409;
                throw error;
            }
        }
        const isEmailExist = await Staff.findOne({
            where: {
                email: email
            }
        });
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (isEmailExist) {
            if (isEmailExist.email !== staff.email) {
                const error = new Error('E-Mail already exists');
                error.statusCode = 409;
                throw error;
            }
        }
        if (role === 'admin') {
            let allStaff = [];
            let singledepartment = '';
            for (let index = 0; index < department.length; index++) {
                const element = department[index];
                allStaff = await Staff.findAll({
                    where: {
                        id: { [Op.ne]: staff.id },
                        department: { [Op.contains]: [element] },
                        role: 'admin'
                    }
                });
                if (allStaff.length !== 0) {
                    singledepartment = element;
                    break;
                }
            }
            if (allStaff.length !== 0) {
                const error = new Error(`Department ${singledepartment} already have an admin`);
                error.statusCode = 409;
                throw error;
            }
        }
        staff.firstname = firstname;
        staff.middlename = middlename;
        staff.lastname = lastname;
        staff.email = email;
        staff.role = role;
        staff.institute = institute;
        staff.department = department;
        staff.departmentType = departmentType;
        staff.phoneNumber = phoneNumber;
        staff.contactExtension = contactExtension;
        if (staff.role === '' || staff.role === null) {
            staff.role = 'user';
            await staff.save();
        }
        const result = await staff.save();
        res.status(200).json({ message: 'Staff details updated', staff: result });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
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
        const firstname = staff.firstname;
        const middlename = staff.middlename;
        const lastname = staff.lastname;
        const email = staff.email;
        const password = staff.password;
        const role = staff.role;
        const institute = staff.institute;
        const department = staff.department;
        const departmentType = staff.departmentType;
        const phoneNumber = staff.phoneNumber;
        const contactExtension = staff.contactExtension;
        const isNew = staff.isNew;
        const trash = new Trash({
            id: id,
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
        const result = await trash.save();
        res.status(201).json({ message: 'Staff added to trash.', staffId: result.id });
        await staff.destroy();
        await staff.save();
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getStaffByRole = async (req, res, next) => {
    const role = req.params.role;
    try {
        const staff = await Staff.findAll({
            where: {
                role: role
            }
        });
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Staff fetched successfully', staff: staff });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.deleteMultipleStaff = async (req, res, next) => {
    const data = req.body;
    try {
        await Trash.bulkCreate(data);
        const ids = [];
        data.map((singleData) => ids.push(singleData.id));
        const staff = await Staff.destroy({ where: { id: ids } });
        res.status(200).json({ message: 'Data deleted successfully', staff: staff });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};