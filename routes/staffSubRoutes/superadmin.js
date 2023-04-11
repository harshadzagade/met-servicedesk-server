const express = require('express');

const router = express.Router();

const superAdminController = require('../../controllers/staffControllers/superadmin');

router.get('/:staffId', superAdminController.getSuperAdmin);

router.post('/createStaff', superAdminController.createStaff);

router.get('/allstaff/:staffId', superAdminController.getAllStaff);

router.get('/staffdetails/:staffId', superAdminController.getStaffDetails);

router.put('/staffdetails/updateStaff/:staffId', superAdminController.updateStaff);

router.delete('/staffdetails/:staffId', superAdminController.deleteStaff);

module.exports = router;