const { validationResult } = require("express-validator");
const Department = require("../models/department");

exports.getAllDepartmentData = async (req, res, next) => {
    try {
        const departmentData = await Department.findAll();
        if (!departmentData) {
            const error = new Error('Departments not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Department data fetched successfully', departmentData: departmentData })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.createDepartment = async (req, res, next) => {
    const errors = validationResult(req);
    const departmentName = req.body.department;
    const type = req.body.type;
    const categories = req.body.category;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        let department;
        switch (type) {
            case 'service':
                department = new Department({
                    department: departmentName,
                    type: type,
                    category: categories
                });
                break;

            case 'regular':
                department = new Department({
                    department: departmentName,
                    type: type
                });
                break;

            default:
                const error = new Error('Invalid institute type');
                error.statusCode = 401;
                throw error;
        }
        const result = await department.save();
        res.status(201).json({ message: 'Department created successfully', department: result })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.editCategories = async (req, res, next) => {
    const errors = validationResult(req);
    const departmentId = req.params.departmentId;
    const categories = req.body.category;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const department = await Department.findByPk(departmentId);
        if (!department) {
            const error = new Error('Department not found');
            error.statusCode = 401;
            throw error;
        }
        switch (department.type) {
            case 'service':
                department.category = categories;
                const result = await department.save();
                res.status(200).json({ message: 'Categories updated successfully', department: result });
                break;

            case 'regular':
                const error1 = new Error('Department does not have any categories');
                error1.statusCode = 401;
                throw error1;

            default:
                const error2 = new Error('Invalid department type');
                error2.statusCode = 401;
                throw error2;
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getAllDepartments = async (req, res, next) => {
    try {
        const departmentData = await Department.findAll({
            attributes: ['department']
        });
        if (!departmentData) {
            const error = new Error('Departments not found');
            error.statusCode = 401;
            throw error;
        }
        let departments = [];
        departmentData.map((singleDepartment) => (
            singleDepartment.department !== null && departments.push(singleDepartment.department)
        ));
        res.status(200).json({ message: 'Department data fetched successfully', departments: departments })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getAllServiceDepartments = async (req, res, next) => {
    try {
        const departmentData = await Department.findAll({
            attributes: ['department'],
            where: {
                type: 'service'
            }
        });
        if (!departmentData) {
            const error = new Error('Departments not found');
            error.statusCode = 401;
            throw error;
        }
        let departments = [];
        departmentData.map((singleDepartment) => (
            singleDepartment.department !== null && departments.push(singleDepartment.department)
        ));
        res.status(200).json({ message: 'Department data fetched successfully', departments: departments })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getAllCategories = async (req, res, next) => {
    const departmentId = req.params.departmentId;
    try {
        const department = await Department.findByPk(departmentId);
        if (!department) {
            const error = new Error('Department not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Categories fetched successfully', categories: department.category })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getAllCategoriesByDepartment = async (req, res, next) => {
    const departmentName = req.params.departmentName;
    try {
        const department = await Department.findOne({
            where: { department: departmentName }
        });
        if (!department) {
            const error = new Error('Department not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Categories fetched successfully', categories: department.category })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.deleteDepartment = async (req, res, next) => {
    const departmentId = req.params.departmentId;
    try {
        const department = await Department.findByPk(departmentId);
        if (!department) {
            const error = new Error('Department not found');
            error.statusCode = 401;
            throw error;
        }
        await department.destroy();
        await department.save();
        res.status(200).json({ message: 'Department deleted successfully.', department: department });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};