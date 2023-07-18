const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const instituteController = require('../controllers/institute');

router.get('/', instituteController.getAllInstituteData);

router.post('/createinstitute',
    [
        body('institute')
            .isEmpty()
            .isLength({ min: 1 })
            .withMessage('Please enter institute name')
            .trim()
    ], instituteController.createInstitute);

router.put('/editinstitute/:instituteId',
    [
        body('institute')
            .isEmpty()
            .isLength({ min: 1 })
            .withMessage('Please enter institute name')
            .trim()
    ], instituteController.editInstitute);

router.delete('/deleteinstitute/:instituteId', instituteController.deleteInstitute);

module.exports = router;