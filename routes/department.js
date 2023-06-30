const express = require('express');

const router = express.Router();

const departmentController = require('../controllers/department');

router.get('/', departmentController.getAllDepartmentData);

router.post('/createdepartment', departmentController.createDepartment);

router.put('/editcategories/:departmentId', departmentController.editCategories);

router.get('/departments', departmentController.getAllDepartments);

router.get('/categories/:departmentId', departmentController.getAllCategories);

module.exports = router;