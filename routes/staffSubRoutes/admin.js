const express = require('express');

const router = express.Router();

const adminController = require('../../controllers/staffControllers/admin');

router.get('/:staffId', adminController.getAdmin);

router.get('/allstaff/:staffId/:currentDepartment', adminController.getAllStaff);

router.get('/staffdetails/:staffId', adminController.getStaffDetails);

router.put('/staffdetails/updateStaff/:staffId', adminController.updateStaff);

router.get('/admindepartments/:staffId', adminController.getAdminDepartments);

router.get('/admindepartmenttechnicians/:staffId/:currentDepartment', adminController.getDepartmentTechnicians);

router.get('/staffbyrole/:department/:role', adminController.getDepartmentStaffByRole);

router.get('/requests/incoming/:department', adminController.getIncomingRequests);

router.get('/requests/outgoing/:staffId/:department', adminController.getOutgoingRequests);

router.get('/complaints/outgoing/:staffId/:department', adminController.getOutgoingComplaints);

router.put('/approval1/:requestId', adminController.putApproval1);

router.put('/approval2/:requestId', adminController.putApproval2);

module.exports = router;