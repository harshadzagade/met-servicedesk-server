const Staff = require('../models/staff');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const Op = require('sequelize').Op;
const otpGenerator = require('otp-generator');
const OneTimePassword = require('../models/onetimepassword');
const { validationResult } = require('express-validator');
const { Sequelize } = require('sequelize');

const generateOTP = () => {
    const OTP = otpGenerator.generate(6, { upperCaseAlphabets: true, specialChars: false });
    return OTP;
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'helpdeskinfo@met.edu',
        pass: 'lzhqhnnscnxiwwqc'
    }
});

exports.checkAuth = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Employee not found');
            error.statusCode = 401;
            throw error;
        }
        switch (staff.role) {
            case 'superadmin':
                res.status(200).json({ id: staffId, role: 'superadmin' });
                break;

            case 'admin':
                res.status(200).json({ id: staffId, role: 'admin' });
                break;

            case 'subadmin':
                res.status(200).json({ id: staffId, role: 'subadmin' });
                break;

            case 'engineer':
                res.status(200).json({ id: staffId, role: 'engineer' });
                break;

            case 'user':
                res.status(200).json({ id: staffId, role: 'user' });
                break;

            default:
                const error = new Error('Employee not found');
                error.statusCode = 404;
                throw error;
        }
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
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Employee not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Employee fetched', staff: staff });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.sendMail = async (req, res, next) => {
    const errors = validationResult(req);
    const loginEmail = req.body.email;
    const OTP = generateOTP();
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        setOTP(OTP);
        const staff = await Staff.findOne({
            where: { email: loginEmail }
        });
        if (!staff) {
            const error = new Error('Employee not found');
            error.statusCode = 401;
            throw error;
        }
        const email = staff.email;
        res.status(200).json({ message: 'OTP Sent!', redirect: true });
        await transporter.sendMail({
            to: email,
            from: 'helpdeskinfo@met.edu',
            subject: 'Reset Password OTP',
            html:
                `
                <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                        <div style="background-color: #DA251C; color: #ffffff; text-align: center; padding: 10px; border-top-left-radius: 5px; border-top-right-radius: 5px;">
                        <h1>MET Helpdesk</h1>
                        </div>
                        <div style="padding: 20px;">
                        <h2 style="color: #0088cc;">OTP Verification</h2>
                        <p>Dear ${staff.firstname + ' ' + staff.lastname},</p>
                        <p>Your One-Time Password (OTP) for verification is:</p>
                        <p style="font-size: 18px; font-weight: bold; color: #ff0000;">${OTP}</p>
                        <p>This OTP will be valid for a limited time period of one minute. Please do not share it with anyone.</p>
                        <p>If you did not request this OTP, please ignore this email.</p>
                        <p>If you have any questions or need assistance, feel free to contact our support team.</p>
                        <p>Best regards,<br> The Helpdesk Team</p>
                        </div>
                        <div style="text-align: center; padding: 10px; background-color: #f4f4f4; border-bottom-left-radius: 5px; border-bottom-right-radius: 5px;">
                        <p>This is an automated email. Please do not reply.</p>
                        </div>
                    </div>
                </body>
            `
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.verifyOTP = async (req, res, next) => {
    const errors = validationResult(req);
    const enteredOTP = req.body.otp;
    const currentTime = new Date();
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const otpModel = await OneTimePassword.findByPk(1);
        if ((otpModel.expiration_time - currentTime) > 0) {
            if (enteredOTP === otpModel.otp) {
                res.status(200).json({ message: 'OTP Verified!' });
            } else {
                const error = new Error('Invalid OTP');
                error.statusCode = 401;
                throw error;
            }
        } else {
            const error = new Error('OTP has been expired');
            error.statusCode = 401;
            throw error;
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    const errors = validationResult(req);
    const email = req.body.email;
    const newPassword = req.body.password;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const staff = await Staff.findOne({
            where: { email: email }
        });
        if (!staff) {
            const error = new Error('Employee not found');
            error.statusCode = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(newPassword, staff.password);
        if (isEqual) {
            const error = new Error('Password already exists');
            error.statusCode = 401;
            throw error;
        }
        staff.password = await bcrypt.hash(newPassword, 12);
        staff.isNew = false;
        const result = await staff.save();
        res.status(200).json({ message: 'New password set successfully', staff: result });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.newUserLogin = async (req, res, next) => {
    const errors = validationResult(req);
    const email = req.body.email;
    const newPassword = req.body.password;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const staff = await Staff.findOne({
            where: { email: email }
        });
        if (!staff) {
            const error = new Error('Employee not found');
            error.statusCode = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(newPassword, staff.password);
        if (isEqual) {
            const error = new Error('Password already exists');
            error.statusCode = 401;
            throw error;
        }
        staff.password = await bcrypt.hash(newPassword, 12);
        staff.isNew = false;
        const result = await staff.save();
        res.status(200).json({ message: 'Employee is not a new user now', staff: result });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getStaffDepartments = async (req, res, next) => {
    const departments = await getDepartments();
    res.status(200).json({ message: 'Fetched departments!', departments: departments });
};

const setOTP = async (OTP) => {
    const currentDate = new Date();
    const expiration_time = new Date(currentDate.getTime() + 66000);
    try {
        const otpModel = await OneTimePassword.findByPk(1);
        if (!otpModel) {
            const otp = new OneTimePassword({
                id: 1,
                otp: OTP,
                expiration_time: expiration_time,
                verified: false
            });
            return await otp.save();
        }
        otpModel.otp = OTP;
        otpModel.expiration_time = expiration_time;
        return await otpModel.save();
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getAllContacts = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Employee not found');
            error.statusCode = 401;
            throw error;
        }
        const contacts = await Staff.findAll({
            where: { id: { [Op.ne]: 1 } },
            attributes: ['firstname', 'middlename', 'lastname', 'email', 'department', 'phoneNumber', 'contactExtension']
        });
        if (!contacts) {
            const error = new Error('Contacts not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Contacts fetched successfully', contacts: contacts });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getSearchedContacts = async (req, res, next) => {
    const staffId = req.params.staffId;
    const query = req.params.query;
    const upperQuery = query.toUpperCase();
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Employee not found');
            error.statusCode = 401;
            throw error;
        }
        const contactStaff = await Staff.findAll({
            attributes: ['firstname', 'middlename', 'lastname', 'email', 'department', 'phoneNumber', 'contactExtension'],
            where: {
                id: { [Op.ne]: 1 },
                [Op.or]: [
                    { firstname: { [Op.iLike]: `%${query}%` } },
                    { lastname: { [Op.iLike]: `%${query}%` } },
                    { email: { [Op.iLike]: `%${query}%` } },
                    Sequelize.literal(
                        `EXISTS (SELECT 1 FROM unnest("staff"."department") AS "dept" WHERE UPPER("dept") LIKE '%${upperQuery}%')`
                    ),
                    { contactExtension: { [Op.iLike]: `%${query}%` } }
                ]
            },
        });
        res.json(contactStaff);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getStaffByDepartment = async (req, res, next) => {
    const department = req.params.department;
    try {
        const staff = await Staff.findAll({
            where: {
                department: {
                    [Op.contains]: [department]
                },
                role: 'engineer'
            }
        });
        if (!staff) {
            const error = new Error('Employee not found');
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

exports.getStaffExistance = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Employee not found');
            error.statusCode = 401;
            throw error;
        } else {
            res.status(200).json({ message: 'Employee exists' });
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

const getDepartments = async () => {
    const totalStaff = await Staff.findAll({ where: { id: { [Op.ne]: 1 } } });
    let allDept = [];
    totalStaff.map((staff) => {
        const department = staff.department;
        allDept = allDept.concat(department);
    });
    const departments = allDept;
    const uniqueDepartments = departments.filter(function (item, position) {
        return departments.indexOf(item) == position;
    });
    return uniqueDepartments;
};