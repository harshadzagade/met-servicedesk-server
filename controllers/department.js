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
    const departmentName = req.body.department;
    const categories = req.body.category;
    try {
        const existingDepartment = await Department.findOne({ where: { department: departmentName } });
        if (existingDepartment) {
            const error = new Error('Department already exists');
            error.statusCode = 401;
            throw error;
        }
        const department = new Department({
            department: departmentName,
            category: categories
        });
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
    const departmentId = req.params.departmentId;
    const categories = req.body.category;
    try {
        const department = await Department.findByPk(departmentId);
        if (!department) {
            const error = new Error('Department not found');
            error.statusCode = 401;
            throw error;
        }
        department.category = categories;
        const result = await department.save();
        res.status(200).json({ message: 'Categories updated successfully', department: result })
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
        const departments = departmentData.map((singleDepartment) => singleDepartment.department);
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