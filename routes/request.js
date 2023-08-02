const express = require('express');

const router = express.Router();

const requestController = require('../controllers/request');

const upload = require('../middleware/uploadfiles');

router.post('/', upload, requestController.sendRequest);

router.get('/allrequests', requestController.getAllRequests);

router.get('/searchallrequests/:query', requestController.searchAllRequests);

router.get('/ownrequests/:staffId', requestController.ownRequests);

router.get('/ownrequestsearch/:staffId/:query', requestController.searchOwnRequests);

router.get('/getrequestdetails/:requestId', requestController.getRequestDetails);

router.get('/requestsbydepartment/:department', requestController.getRequestByDepartment);

router.get('/requestsbydepartmentsearch/:department/:query', requestController.searchRequestsByDepartment);

router.get('/downloadfile/:requestId', requestController.downloadFiles);

module.exports = router;