const express = require('express');

const router = express.Router();

const requestController = require('../controllers/request');

router.post('/', requestController.sendRequest);

router.get('/allrequests', requestController.getAllRequests);

router.get('/ownrequests/:staffId', requestController.ownRequests);

router.put('/approval1/:requestId', requestController.putApproval1);

router.put('/approval2/:requestId', requestController.putApproval2);

module.exports = router;