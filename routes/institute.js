const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const instituteController = require('../controllers/institute');
const Institute = require('../models/institute');

router.get('/', instituteController.getAllInstituteData);

router.post('/createinstitute',
    [
        body('institute')
            .trim()
            .isLength({ min: 1 }).withMessage('Please enter institute name')
            .custom((value) => {
                return Institute.findOne({ where: { institute: value } }).then((institute) => {
                    if (institute) {
                        return Promise.reject('Institute already exists');
                    }
                });
            })
    ], instituteController.createInstitute);

router.put('/editinstitute/:instituteId',
    [
        body('institute')
            .trim()
            .isLength({ min: 1 }).withMessage('Please enter institute name')
    ], instituteController.editInstitute);

router.delete('/deleteinstitute/:instituteId', instituteController.deleteInstitute);

module.exports = router;