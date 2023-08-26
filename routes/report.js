const express = require('express');

const router = express.Router();

const reportController = require('../controllers/report');

router.get('/:staffId', reportController.getFullReport);

router.get('/departmentreport/:department', reportController.getDepartmentReport);

router.get('/request/:staffId', reportController.getRequestReport);

router.get('/complaint/:staffId', reportController.getComplaintReport);

router.get('/reportdetails/:reportId', reportController.getReportDetails);

router.get('/reportcategories/categories', reportController.getReportCategories);

router.get('/reportbycategory/:category', reportController.getReportByCategory);

router.get('/reportbypriority/:priority', reportController.getReportByPriority);

router.post('/reportcsv', reportController.getReportCsv);

module.exports = router;