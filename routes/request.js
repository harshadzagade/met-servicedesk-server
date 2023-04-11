const express = require('express');

const router = express.Router();

const requestController = require('../controllers/request');

router.post('/', requestController.sendRequest);

router.get('/allrequests', requestController.getAllRequests);

module.exports = router;