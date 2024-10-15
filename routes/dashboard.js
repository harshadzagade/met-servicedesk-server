const express = require('express');

const router = express.Router();

const dashboardController = require('../controllers/dashboard');

// router.get('/:role/:department/:staffId', dashboardController.getDashboardData);
router.get('/:role/:department/', dashboardController.getDashboardData);

module.exports = router;