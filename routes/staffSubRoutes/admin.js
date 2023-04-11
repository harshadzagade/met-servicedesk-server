const express = require('express');

const router = express.Router();

const adminController = require('../../controllers/staffControllers/admin');

router.get('/:staffId', adminController.getAdmin);

router.get('/allstaff/:staffId', adminController.getAllStaff);

router.get('/staffdetails/:staffId', adminController.getStaffDetails);

router.put('/staffdetails/updateStaff/:staffId', adminController.updateStaff);

router.get('/requests/:staffId', adminController.getIncomingRequests);

module.exports = router;