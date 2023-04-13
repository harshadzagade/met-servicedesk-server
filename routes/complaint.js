const express = require('express');

const router = express.Router();

const complaintController = require('../controllers/complaint');

router.post('/', complaintController.sendComplaint);

router.get('/allcomplaints', complaintController.getAllComplaints);

router.get('/owncomplaints/:staffId', complaintController.ownComplaints);

router.get('/complaints/incoming/:staffId', complaintController.getIncomingComplaints);

module.exports = router;