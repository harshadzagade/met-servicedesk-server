const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const superAdminController = require('../../controllers/staffControllers/superadmin');
const Staff = require('../../models/staff');

router.get('/:staffId', superAdminController.getSuperAdmin);

router.post('/createStaff',
    [
        body('firstname', 'Please enter valid firstname')
            .trim()
            .isLength({ min: 1 }),
        body('middlename', 'Please enter valid middlename')
            .trim()
            .isLength({ min: 1 }),
        body('lastname', 'Please enter valid lastname')
            .trim()
            .isLength({ min: 1 }),
        body('email')
            .trim()
            .isEmail().withMessage('Please enter valid email address')
            .custom((value) => {
                return Staff.findOne({
                    where: {
                        email: value
                    }
                }).then((isEmailExist) => {
                    if (isEmailExist) {
                        return Promise.reject('E-Mail address already exists');
                    }
                });
            })
            .normalizeEmail(),
        body('password', 'Password has to be valid')
            .trim()
            .isLength({ min: 6 }),
        body('institute', 'Please enter valid institute')
            .trim()
            .isLength({ min: 1 }),
        body('department')
            .isArray().withMessage('Please enter valid department')
            .custom((value) => {
                if (value.length === 0) {
                    return Promise.reject('Please enter valid department');
                } else {
                    return true;
                }
            }),
        body('departmentType')
            .trim()
            .isLength({ min: 1 }).withMessage('Please select valid department type')
            .custom((value) => {
                if (value !== 'teaching' && value !== 'non-teaching') {
                    return Promise.reject('Please select valid department type');
                } else {
                    return true;
                }
            }),
        body('phoneNumber', 'Please enter valid phone number')
            .trim()
            .matches(/^(\+\d{1,3})?(\d{10})$/),
        body('contactExtension')
            .trim()
            .isLength({ min: 3 }).withMessage('Please enter valid extension number')
            .matches(/^[^a-zA-Z]+$/).withMessage('Please enter valid extension number')
    ], superAdminController.createStaff);

router.get('/allstafflist/fullstaff', superAdminController.getAllStaff);

router.put('/staffdetails/updateStaff/:staffId',
    [
        body('firstname', 'Please enter valid firstname')
            .trim()
            .isLength({ min: 1 }),
        body('middlename', 'Please enter valid middlename')
            .trim()
            .isLength({ min: 1 }),
        body('lastname', 'Please enter valid lastname')
            .trim()
            .isLength({ min: 1 }),
        body('email')
            .isEmail().withMessage('Please enter valid email address')
            .normalizeEmail(),
        body('role')
            .trim()
            .isLength({ min: 1 }).withMessage('Please select valid role')
            .custom((value) => {
                if (value !== 'admin' && value !== 'technician' && value !== 'user') {
                    return Promise.reject('Please select valid role');
                } else {
                    return true;
                }
            }),
        body('institute', 'Please enter valid institute')
            .trim()
            .isLength({ min: 1 }),
        body('department')
            .trim()
            .isArray().withMessage('Please enter valid department')
            .isArray().withMessage('Please enter valid department')
            .custom((value) => {
                if (value.length === 0) {
                    return Promise.reject('Please enter valid department');
                } else {
                    return true;
                }
            }),
        body('departmentType')
            .trim()
            .isLength({ min: 1 }).withMessage('Please select valid department type')
            .custom((value) => {
                if (value !== 'teaching' && value !== 'non-teaching') {
                    return Promise.reject('Please select valid department type');
                } else {
                    return true;
                }
            }),
        body('phoneNumber', 'Please enter valid phone number')
            .trim()
            .matches(/^(\+\d{1,3})?(\d{10})$/),
        body('contactExtension')
            .trim()
            .isLength({ min: 3 }).withMessage('Please enter valid extension number')
            .matches(/^[^a-zA-Z]+$/).withMessage('Please enter valid extension number')
    ], superAdminController.updateStaff);

router.delete('/staffdetails/:staffId', superAdminController.deleteStaff);

router.delete('/deletemultiple', superAdminController.deleteMultipleStaff);

router.get('/searchallstaff/:query', superAdminController.searchAllStaff);

module.exports = router;