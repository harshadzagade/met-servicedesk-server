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
        const directoryPath = path.join(__dirname, 'policies');
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }
        const filePath = path.join(directoryPath, uniqueFileName);
        await policyFile.mv(filePath);
        const newPolicy = await Policy.create({
            policyName: policyName,
            policyFileReference: filePath
        });
        res.status(201).json({ message: 'Policy added successfully', policy: newPolicy });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.deletePolicy = async (req, res, next) => { };