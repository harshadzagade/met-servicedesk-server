const Policy = require("../models/policy");
const fs = require('fs');
const path = require('path');
const { validationResult } = require("express-validator");

exports.getAllPolicies = async (req, res, next) => {
    try {
        const policies = await Policy.findAll();
        res.status(200).json({ message: 'Fetched all policies successfully', policies: policies });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.addPolicy = async (req, res, next) => {
    const errors = validationResult(req);
    const policyName = req.body.policyName;
    const policyFile = req.files.policyFile;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const sanitizedPolicyName = policyName.replace(/ /g, '_').toLowerCase();
        const fileExtension = path.extname(policyFile.name);
        const uniqueFileName = `${sanitizedPolicyName}${fileExtension}`;
        const directoryPath = path.join(__dirname, '..', 'policies');
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }
        const filePath = path.join(directoryPath, uniqueFileName);
        await policyFile.mv(filePath);
        const newPolicy = await Policy.create({
            policyName: policyName,
            policyFileReference: uniqueFileName
        });
        res.status(201).json({ message: 'Policy added successfully', policy: newPolicy });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.deletePolicy = async (req, res, next) => {
    const policyId = req.params.policyId;
    try {
        const policy = await Policy.destroy({
            where: {
                id: policyId
            }
        });
        if (policy === 0) {
            const error = new Error('Policy not found');
            error.statusCode = 404;
            throw error;
        } else {
            res.status(200).json({ message: 'Policy deleted successfully' });
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};