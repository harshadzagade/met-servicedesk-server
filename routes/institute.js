const express = require('express');

const router = express.Router();

const instituteController = require('../controllers/institute');

router.get('/', instituteController.getAllInstituteData);

router.post('/createinstitute', instituteController.createInstitute);

router.put('/editinstitute/:instituteId', instituteController.editInstitute);

router.delete('/deleteinstitute/:instituteId', instituteController.deleteInstitute);

module.exports = router;