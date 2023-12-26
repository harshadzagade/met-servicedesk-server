const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const policyController = require('../controllers/policy');
const Policy = require('../models/policy');
const sequelize = require('../utils/database');

router.get('/', policyController.getAllPolicies);

router.post('/addpolicy',
    [
        body('policyName')
            .trim()
            .isLength({ min: 1 }).withMessage('Please select valid policy name')
            .custom(async (value) => {
                const inputValue = value.toLowerCase();
                const existingPolicy = await Policy.findOne({
                    where: sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('policyName')),
                        inputValue
                    )
                });
                if (existingPolicy) {
                    return Promise.reject('Policy already exists');
                }
            })
    ], policyController.addPolicy);

router.delete('/deletepolicy/:policyId', policyController.deletePolicy);

router.put('/editpolicy/:policyId', policyController.updatePolicy);

module.exports = router;