const express = require('express');

const router = express.Router();

const complaintController = require('../controllers/complaint');

router.post('/', complaintController.sendComplaint);

router.get('/allcomplaints', complaintController.getAllComplaints);

router.get('/searchallcomplaints/:query', complaintController.searchAllComplaints);

router.get('/owncomplaints/:staffId', complaintController.ownComplaints);

router.get('/owncomplaintsearch/:staffId/:query', complaintController.searchOwnComplaints);

router.get('/complaints/incoming/:department', complaintController.getIncomingComplaints);

router.get('/complaints/incomingcomplaintsearch/:department/:query', complaintController.searchIncomingComplaints);

router.get('/getcomplaintdetails/:complaintId', complaintController.getComplaintDetails);

router.get('/downloadfile/:complaintId', complaintController.downloadFiles);

module.exports = router;