const express = require('express');

const router = express.Router();

const reportController = require('../controllers/report');

router.get('/', reportController.getAllRequestReport);

module.exports = router;