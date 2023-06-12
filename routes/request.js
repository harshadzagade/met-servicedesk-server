const express = require('express');

const router = express.Router();

const requestController = require('../controllers/request');

router.post('/', requestController.sendRequest);

router.get('/allrequests', requestController.getAllRequests);

router.get('/ownrequests/:staffId', requestController.ownRequests);

router.get('/getrequestdetails/:requestId', requestController.getRequestDetails);

router.get('/requestdepartments', requestController.getRequestDepartments);

router.get('/requestsbydepartment/:department', requestController.getRequestByDepartment);

module.exports = router;