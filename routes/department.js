const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const departmentController = require('../controllers/department');
const Department = require('../models/department');

router.get('/', departmentController.getAllDepartmentData);

router.post('/createdepartment',
    [
        body('department')
            .trim()
            .isLength({ min: 1 }).withMessage('Please enter department name')
            .custom((value) => {
                return Department.findOne({ where: { department: value } }).then((department) => {
                    if (department) {
                        return Promise.reject('Department already exists');
                    }
                });
            }),
        body('type')
            .trim()
            .isLength({ min: 1 }).withMessage('Please select department type')
            .custom((value) => {
                if (value !== 'regular' && value !== 'service') {
                    return Promise.reject('Please select valid department type');
                } else {
                    return true;
                }
            }),
        body('category')
            .if(body('type').equals('service'))
            .isArray().withMessage('Please enter valid categories')
            .custom((value) => {
                if (value.length === 0) {
                    return Promise.reject('Please enter valid categories');
                } else {
                    return true;
                }
            })
    ], departmentController.createDepartment);

router.put('/editdepartment/:departmentId',
    [
        body('departmentName')
            .isLength({ min: 1 }).withMessage('Please enter valid department name'),
        body('type')
            .custom((value) => {
                if (value !== 'service' && value !== 'regular') {
                    return Promise.reject('Please enter valid department type');
                } else {
                    return true;
                }
            }),
        body('category')
            .custom((value, { req }) => {
                const type = req.body.type;
                if (type === 'service' && value.length === 0) {
                    return Promise.reject('Please enter valid categories');
                } else {
                    return true;
                }
            })
    ], departmentController.editCategories);

router.get('/alldepartments', departmentController.getAllDepartments);

router.get('/departments', departmentController.getAllServiceDepartments);

router.get('/departmentdetails/:departmentId', departmentController.getDepartmentDetails);

router.get('/categoriesbydepartment/:departmentName', departmentController.getAllCategoriesByDepartment);

router.delete('/deletedepartment/:departmentId', departmentController.deleteDepartment);

module.exports = router;