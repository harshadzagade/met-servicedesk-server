const express = require('express');

const router = express.Router();

const adminController = require('../../controllers/staffControllers/admin');

router.get('/:staffId', adminController.getAdmin);

router.get('/allstaff/:staffId', adminController.getAllStaff);

router.get('/staffdetails/:staffId', adminController.getStaffDetails);

router.put('/staffdetails/updateStaff/:staffId', adminController.updateStaff);

router.get('/requests/incoming/:department', adminController.getIncomingRequests);

router.get('/requests/outgoing/:department', adminController.getOutgoingRequests);

router.get('/complaints/outgoing/:department', adminController.getOutgoingComplaints);

router.put('/approval1/:requestId', adminController.putApproval1);

router.put('/approval2/:requestId', adminController.putApproval2);

module.exports = router;