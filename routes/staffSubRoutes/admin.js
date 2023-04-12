const express = require('express');

const router = express.Router();

const adminController = require('../../controllers/staffControllers/admin');

router.get('/:staffId', adminController.getAdmin);

router.get('/allstaff/:staffId', adminController.getAllStaff);

router.get('/staffdetails/:staffId', adminController.getStaffDetails);

router.put('/staffdetails/updateStaff/:staffId', adminController.updateStaff);

router.get('/requests/incoming/:staffId', adminController.getIncomingRequests);

router.get('/requests/outgoing/:staffId', adminController.getOutgoingRequests);

router.get('/complaints/incoming/:staffId', adminController.getIncomingComplaints);

router.get('/complaints/outgoing/:staffId', adminController.getOutgoingComplaints);

module.exports = router;