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
    const instituteName = req.body.institute;
    const instituteType = req.body.type;
    const departmentName = req.body.department;
    const categories = req.body.category;
    try {
        const existingDepartment = await Department.findOne({ where: { department: departmentName } });
        if (existingDepartment) {
            const error = new Error('Department already exists');
            error.statusCode = 401;
            throw error;
        }
        let department;
        switch (instituteType) {
            case 'service':
                department = new Department({
                    institute: instituteName,
                    instituteType: instituteType,
                    department: departmentName,
                    category: categories
                });
                break;

            case 'teaching':
                department = new Department({
                    institute: instituteName,
                    instituteType: instituteType
                });
                break;

            case 'non-teaching':
                department = new Department({
                    institute: instituteName,
                    instituteType: instituteType
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
    const departmentId = req.params.departmentId;
    const categories = req.body.category;
    try {
        const department = await Department.findByPk(departmentId);
        if (!department) {
            const error = new Error('Department not found');
            error.statusCode = 401;
            throw error;
        }
        switch (department.instituteType) {
            case 'service':
                department.category = categories;
                const result = await department.save();
                res.status(200).json({ message: 'Categories updated successfully', department: result });
                break;

            case 'teaching':
                const error1 = new Error('Institute does not have any categories');
                error1.statusCode = 401;
                throw error1;
                break;

            case 'non-teaching':
                const error2 = new Error('Institute does not have any categories');
                error2.statusCode = 401;
                throw error2;
                break;

            default:
                const error3 = new Error('Invalid institute type');
                error3.statusCode = 401;
                throw error3;
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