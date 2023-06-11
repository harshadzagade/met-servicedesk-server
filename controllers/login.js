const Staff = require("../models/staff");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.postLogin = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedStaff;
    try {
        const staff = await Staff.findOne({
            where: {
                email: email
            }
        });
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401; // 401 means not authenticated
            throw error;
        }
        loadedStaff = staff;
        const isEqual = await bcrypt.compare(password, staff.password);
        if (!isEqual) {
            const error = new Error('Password is incorrect');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign(
            {
                email: loadedStaff.email,
                staffId: loadedStaff.id
            },
            'somesupersecretsecret',
            { expiresIn: '1h' }
        );
        res.status(200).json({ message: 'Login Successful!', token: token, staffId: loadedStaff.id });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};