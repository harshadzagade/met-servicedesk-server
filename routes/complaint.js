const express = require('express');

const router = express.Router();

const complaintController = require('../controllers/complaint');

const upload = require('../middleware/uploadfiles');

router.post('/', upload, complaintController.sendComplaint);

router.get('/allcomplaints', complaintController.getAllComplaints);

router.get('/owncomplaints/:staffId', complaintController.ownComplaints);

router.get('/complaints/incoming/:department', complaintController.getIncomingComplaints);

router.get('/getcomplaintdetails/:complaintId', complaintController.getComplaintDetails);

router.get('/complaintdepartments', complaintController.getComplaintDepartments);

router.get('/complaintsbydepartment/:department', complaintController.getComplaintByDepartment);

router.get('/complaintcategories', complaintController.getComplaintCategories);

router.get('/complaintsbycategory/:category', complaintController.getComplaintByCategory);

router.get('/complaintsbypriority/:priority', complaintController.getComplaintByPriority);

router.get('/complaintsbystatus/:status', complaintController.getComplaintByStatus);

module.exports = router;