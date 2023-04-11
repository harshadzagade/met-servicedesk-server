const express = require('express');

const router = express.Router();

const complaintController = require('../controllers/complaint');

router.post('/', complaintController.sendComplaint);

router.get('/allcomplaints', complaintController.getAllComplaints);

module.exports = router;