const Institute = require('../models/institute');
const { validationResult } = require('express-validator');

exports.getAllInstituteData = async (req, res, next) => {
    try {
        const instituteData = await Institute.findAll();
        if (!instituteData) {
            const error = new Error('Institutes not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Institute data fetched successfully', instituteData: instituteData })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.createInstitute = async (req, res, next) => {
    const errors = validationResult(req);
    const instituteName = req.body.institute;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const institute = new Institute({
            institute: instituteName
        });
        const result = await institute.save();
        res.status(201).json({ message: 'Institute created successfully', institute: result })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.editInstitute = async (req, res, next) => {
    const errors = validationResult(req);
    const instituteId = req.params.instituteId;
    const instituteName = req.body.instituteName;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const institute = await Institute.findByPk(instituteId);
        if (!institute) {
            const error = new Error('Institute not found');
            error.statusCode = 401;
            throw error;
        }
        institute.institute = instituteName;
        const result = await institute.save();
        res.status(200).json({ message: 'Institute updated successfully', institute: result });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.deleteInstitute = async (req, res, next) => {
    const instituteId = req.params.instituteId;
    try {
        const institute = await Institute.findByPk(instituteId);
        if (!institute) {
            const error = new Error('Institute not found');
            error.statusCode = 401;
            throw error;
        }
        await institute.destroy();
        await institute.save();
        res.status(200).json({ message: 'Institute deleted successfully.', institute: institute });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};