const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const superAdminController = require('../../controllers/staffControllers/superadmin');
const Staff = require('../../models/staff');

router.get('/:staffId', superAdminController.getSuperAdmin);

router.post('/createStaff',
    [
        body('firstname', 'Please enter valid firstname')
            .isLength({ min: 1 })
            .trim(),
        body('middlename', 'Please enter valid middlename')
            .isLength({ min: 1 })
            .trim(),
        body('lastname', 'Please enter valid lastname')
            .isLength({ min: 1 })
            .trim(),
        body('email')
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
        body('password', 'Password has to be valid.')
            .isLength({ min: 6 })
            .trim(),
        body('institute', 'Please enter valid institute')
            .isLength({ min: 1 })
            .trim(),
        body('department')
            .isArray().withMessage('Please enter valid department')
            .isLength({ min: 1 }).withMessage('Please enter valid department')
            .trim(),
        body('departmentType')
            .isLength({ min: 1 }).withMessage('Please select valid department type')
            .custom((value) => {
                if (value !== 'teaching' && value !== 'non-teaching') {
                    return Promise.reject('Please select valid department type');
                } else {
                    return true;
                }
            })
            .trim(),
        body('phoneNumber', 'Please enter valid phone number')
            .matches(/^(\+\d{1,3})?(\d{10})$/)
            .trim(),
        body('contactExtension')
            .isLength({ min: 3 }).withMessage('Please enter valid extension number')
            .matches(/^[^a-zA-Z]+$/).withMessage('Please enter valid extension number')
            .trim()
    ], superAdminController.createStaff);

router.get('/allstafflist/fullstaff', superAdminController.getAllStaff);

router.get('/staffdetails/:staffId', superAdminController.getStaffDetails);

router.put('/staffdetails/updateStaff/:staffId', superAdminController.updateStaff);

router.delete('/staffdetails/:staffId', superAdminController.deleteStaff);

router.delete('/deletemultiple', superAdminController.deleteMultipleStaff);

router.get('/staffbyrole/:role', superAdminController.getStaffByRole);

module.exports = router;