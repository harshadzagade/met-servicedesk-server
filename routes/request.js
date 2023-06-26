const express = require('express');

const router = express.Router();

const requestController = require('../controllers/request');

const upload = require('../middleware/uploadfiles');

router.post('/', upload, requestController.sendRequest);

router.get('/allrequests', requestController.getAllRequests);

router.get('/ownrequests/:staffId', requestController.ownRequests);

router.get('/getrequestdetails/:requestId', requestController.getRequestDetails);

router.get('/requestdepartments', requestController.getRequestDepartments);

router.get('/requestsbydepartment/:department', requestController.getRequestByDepartment);

router.get('/requestcategories', requestController.getRequestCategories);

router.get('/requestsbycategory/:category', requestController.getRequestByCategory);

router.get('/requestsbypriority/:priority', requestController.getRequestByPriority);

router.get('/requestsbystatus/:status', requestController.getRequestByStatus);

router.get('/requestsbyapproval1/:approval', requestController.getRequestByHodApproval);

router.get('/requestsbyapproval2/:approval', requestController.getRequestByAdminApproval);

module.exports = router;