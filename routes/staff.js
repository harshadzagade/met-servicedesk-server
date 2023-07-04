const express = require('express');

const router = express.Router();

const staffController = require('../controllers/staff');

const superAdminRoutes = require('./staffSubRoutes/superadmin');
const adminRoutes = require('./staffSubRoutes/admin');
const technicianRoutes = require('./staffSubRoutes/technician');
const userRoutes = require('./staffSubRoutes/user');

router.get('/check/:staffId', staffController.checkAuth);

router.get('/staffdetails/:staffId', staffController.getStaffDetails);

router.put('/newuserlogin', staffController.newUserLogin);

router.post('/sendotp', staffController.sendMail);

router.post('/verifyotp', staffController.verifyOTP);

router.put('/resetpassword', staffController.resetPassword);

router.get('/departments', staffController.getStaffDepartments);

router.get('/contacts/:staffId', staffController.getAllContacts);

router.get('/staffbydepartment/:department', staffController.getStaffByDepartment);

router.get('/checkstaffexistence/:staffId', staffController.getStaffExistance);

router.use('/superadmin', superAdminRoutes);

router.use('/admin', adminRoutes);

router.use('/technician', technicianRoutes);

router.use('/user', userRoutes);

module.exports = router;