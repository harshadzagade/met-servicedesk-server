const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const adminController = require('../../controllers/staffControllers/admin');

router.get('/allstaff/:staffId/:currentDepartment', adminController.getAllStaff);

router.get('/searchalldepartmentstaff/:currentDepartment/:query', adminController.searchDepartmentStaff);

router.put('/staffdetails/updateStaff/:staffId',
    [
        body('role')
            .isLength({ min: 1 }).withMessage('Please select valid role')
            .custom((value) => {
                if (value === 'superadmin' || value === 'admin') {
                    return Promise.reject('Not allowed to edit role of admin or super-admin');
                } else if (value !== 'subadmin' && value !== 'technician' && value !== 'user') {
                    return Promise.reject('Please select valid role');
                } else {
                    return true;
                }
            })
            .trim()
    ], adminController.updateStaff);

router.get('/admindepartments/:staffId', adminController.getAdminDepartments);

router.get('/admindepartmenttechnicians/:staffId/:currentDepartment', adminController.getDepartmentTechnicians);

router.get('/requests/incoming/:department', adminController.getIncomingRequests);

router.get('/requests/incomingrequestsearch/:department/:query', adminController.searchIncomingRequests);

router.get('/requests/outgoing/:staffId/:department', adminController.getOutgoingRequests);

router.get('/requests/outgoingrequestsearch/:staffDepartment/:query', adminController.searchOutgoingRequests);

router.get('/complaints/outgoing/:staffId/:department', adminController.getOutgoingComplaints);

router.get('/complaints/outgoingcomplaintsearch/:staffDepartment/:query', adminController.searchOutgoingComplaints);

router.put('/assigncomplaint/:complaintId', adminController.assignComplaint);

router.put('/approval1/:requestId',
    [
        body('approval')
            .trim()
            .custom((value) => {
                if (value !== '1' && value !== '2') {
                    return Promise.reject('Please select valid approval status');
                } else {
                    return true;
                }
            }),
        body('approvalComment')
            .trim()
            .isLength({ min: 1 }).withMessage('Please enter valid approval comment')
    ], adminController.putApproval1);

router.put('/approval2/:requestId',
    [
        body('approval')
            .trim()
            .custom((value) => {
                if (value !== '1' && value !== '2') {
                    return Promise.reject('Please select valid approval status');
                } else {
                    return true;
                }
            }),
        body('approvalComment')
            .trim()
            .isLength({ min: 1 }).withMessage('Please enter valid approval comment'),
        body('staffId')
            .if(body('approval').equals('1'))
            .trim()
            .isNumeric().withMessage('Please provide valid staff ID to assign task to technician')
            .isLength({ min: 1 }).withMessage('Please provide valid staff ID to assign task to technician')
    ], adminController.putApproval2);

router.get('/subadminactivities/:adminId/:department', adminController.getsubadminActivities);

module.exports = router;