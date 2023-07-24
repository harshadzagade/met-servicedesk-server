const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const loginController = require('../controllers/login');

router.post('/',
    [
        body('email')
            .trim()
            .isEmail().withMessage('Please enter valid email address')
            .normalizeEmail(), // it will store email in database in lowercase also will remove whitespaces
        body('password', 'Password has to be valid') // default message
            .trim()
            .isLength({ min: 6 })
    ], loginController.postLogin);

module.exports = router;