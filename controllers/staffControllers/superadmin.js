const Staff = require("../../models/staff");
const bcrypt = require('bcryptjs');
const Trash = require("../../models/trash");
const Op = require('sequelize').Op;
const { validationResult } = require('express-validator');
const { Sequelize } = require("sequelize");
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'helpdeskinfo@met.edu',
        pass: 'lzhqhnnscnxiwwqc'
    }
});

exports.createStaff = async (req, res, next) => {
    const errors = validationResult(req);
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
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
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
        await userWelcomeEmail(firstname + ' ' + lastname, email, password, next);
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

exports.updateStaff = async (req, res, next) => {
    const errors = validationResult(req);
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
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
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
        staff.phoneNumber = phoneNumber === '0' ? null : phoneNumber;
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

exports.searchAllStaff = async (req, res, next) => {
    const query = req.params.query;
    const upperQuery = query.toUpperCase();
    try {
        const staff = await Staff.findAll({
            where: {
                id: { [Op.ne]: 1 },
                [Op.or]: [
                    { firstname: { [Op.iLike]: `%${query}%` } },
                    { middlename: { [Op.iLike]: `%${query}%` } },
                    { lastname: { [Op.iLike]: `%${query}%` } },
                    { email: { [Op.iLike]: `%${query}%` } },
                    { role: { [Op.iLike]: `%${query}%` } },
                    { institute: { [Op.iLike]: `%${query}%` } },
                    Sequelize.literal(
                        `EXISTS (SELECT 1 FROM unnest("staff"."department") AS "dept" WHERE UPPER("dept") LIKE '%${upperQuery}%')`
                    ),
                    { contactExtension: { [Op.iLike]: `%${query}%` } },
                    Sequelize.where(
                        Sequelize.cast(Sequelize.col('phoneNumber'), 'TEXT'),
                        { [Op.iLike]: `%${query}%` }
                    )
                ],
            },
        });
        res.json(staff);
    } catch (error) {
        console.log(error);
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

const userWelcomeEmail = async (name, email, password, next) => {
    try {
        await transporter.sendMail({
            to: email,
            from: 'helpdeskinfo@met.edu',
            subject: `Welcome to MET`,
            html:
                `
                <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                        <div style="background-color: #007bff; color: #ffffff; text-align: center; padding: 10px; border-top-left-radius: 5px; border-top-right-radius: 5px;">
                        <h1>Welcome to MET!</h1>
                        </div>
                        <div style="padding: 20px;">
                        <p>Hello ${name},</p>
                        <p>Thank you for joining MET! We're excited to have you on board.</p>
                        <p>Your login credentials are as follows:</p>
                        <ul>
                            <li><strong>Email:</strong> ${email}</li>
                            <li><strong>Password:</strong> ${password}</li>
                        </ul>
                        <p>Please log in using the provided credentials and change your password after the initial login for security reasons.</p>
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