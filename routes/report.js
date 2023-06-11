const express = require('express');

const router = express.Router();

const reportController = require('../controllers/report');

router.get('/:staffId', reportController.getFullReport);

router.get('/request/:staffId', reportController.getRequestReport);

router.get('/complaint/:staffId', reportController.getComplaintReport);

router.get('/reportdetails/:reportId', reportController.getReportDetails);

module.exports = router;