const Staff = require('../models/staff');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const Op = require('sequelize').Op;

const otpGenerator = require('otp-generator');
const OneTimePassword = require('../models/onetimepassword');
const { getStaffDetailsCommon, getDepartments } = require('../utils/functions');

const generateOTP = () => {
    const OTP = otpGenerator.generate(6, { upperCaseAlphabets: true, specialChars: false });
    return OTP;
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'siddharthbhat777@gmail.com',
        pass: 'itrflpdafyeavfzd'
    }
});

exports.checkAuth = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
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

            case 'technician':
                res.status(200).json({ id: staffId, role: 'technician' });
                break;

            case 'user':
                res.status(200).json({ id: staffId, role: 'user' });
                break;

            default:
                const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getStaffDetails = (req, res, next) => {
    const staffId = req.params.staffId;
    getStaffDetailsCommon(staffId, res, next);
};

exports.sendMail = async (req, res, next) => {
    const loginEmail = req.body.email;
    const OTP = generateOTP();
    try {
        setOTP(OTP);
        const staff = await Staff.findOne({
            where: { email: loginEmail }
        });
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        const email = staff.email;
        res.status(200).json({ message: 'OTP Sent!', redirect: true });
        await transporter.sendMail({
            to: email,
            from: 'siddharthbhat777@gmail.com',
            subject: 'Reset Password OTP',
            html:
                `
            <div class="container" style="max-width: 90%; margin: auto; padding-top: 20px">
                <h2>MET Service Desk</h2>
                <h4>Verify OTP ✔</h4>
                <p style="margin-bottom: 30px;">Please enter the sign up OTP to get started</p>
                <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${OTP}</h1>
            </div>
            `
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.verifyOTP = async (req, res, next) => {
    const enteredOTP = req.body.otp;
    const currentTime = new Date();
    try {
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
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.resetPassword = async (req, res, next) => {
    const email = req.body.email;
    const newPassword = req.body.password;
    try {
        const staff = await Staff.findOne({
            where: { email: email }
        });
        if (!staff) {
            const error = new Error('Staff not found');
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
        res.status(200).json({ message: 'New password set successfully!', staff: result });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.newUserLogin = async (req, res, next) => {
    const email = req.body.email;
    const newPassword = req.body.password;
    try {
        const staff = await Staff.findOne({
            where: { email: email }
        });
        if (!staff) {
            const error = new Error('Staff not found');
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
        res.status(200).json({ message: 'Staff is not a new user now.', staff: result });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getStaffDepartments = async (req, res, next) => {
    const departments = await getDepartments();
    res.status(200).json({ message: 'Fetched departments!', departments: departments });
};

const setOTP = async (OTP) => {
    const currentDate = new Date();
    const expiration_time = new Date(currentDate.getTime() + 60000);
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
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getAllContacts = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        let contacts;
        if (staff.role === 'superadmin') {
            contacts = await Staff.findAll({
                where: { id: { [Op.ne]: 1 } },
                attributes: ['firstname', 'lastname', 'department', 'phoneNumber', 'contactExtension']
            });
        } else if (staff.role === 'admin') {
            contacts = await Staff.findAll({
                where: { id: { [Op.ne]: 1 } },
                attributes: ['firstname', 'lastname', 'department', 'phoneNumber', 'contactExtension']
            });
        } else {
            contacts = await Staff.findAll({
                where: { id: { [Op.ne]: 1 } },
                attributes: ['firstname', 'lastname', 'department', 'contactExtension']
            });
        }
        if (!contacts) {
            const error = new Error('Contacts not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Contacts fetched successfully', contacts: contacts });
    } catch (error) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};