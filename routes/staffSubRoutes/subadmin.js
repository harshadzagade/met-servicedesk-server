const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const subadminController = require('../../controllers/staffControllers/subadmin');

router.get('/:staffId', subadminController.getAdmin);

router.get('/allstaff/:staffId/:currentDepartment', subadminController.getAllStaff);

router.get('/searchalldepartmentstaff/:currentDepartment/:query', subadminController.searchDepartmentStaff);

router.get('/staffdetails/:staffId', subadminController.getStaffDetails);

router.put('/staffdetails/updateStaff/:staffId',
    [
        body('role')
            .isLength({ min: 1 }).withMessage('Please select valid role')
            .custom((value) => {
                if (value === 'superadmin' || value === 'admin') {
                    return Promise.reject('Not allowed to edit role of admin or super-admin');
                } else if (value !== 'technician' && value !== 'user') {
                    return Promise.reject('Please select valid role');
                } else {
                    return true;
                }
            })
            .trim()
    ], subadminController.updateStaff);

router.get('/admindepartments/:staffId', subadminController.getAdminDepartments);

router.get('/admindepartmenttechnicians/:staffId/:currentDepartment', subadminController.getDepartmentTechnicians);

router.get('/staffbyrole/:department/:role', subadminController.getDepartmentStaffByRole);

router.get('/requests/incoming/:department', subadminController.getIncomingRequests);

router.get('/requests/incomingrequestsearch/:department/:query', subadminController.searchIncomingRequests);

router.get('/requests/outgoing/:staffId/:department', subadminController.getOutgoingRequests);

router.get('/requests/outgoingrequestsearch/:staffDepartment/:query', subadminController.searchOutgoingRequests);

router.get('/complaints/outgoing/:staffId/:department', subadminController.getOutgoingComplaints);

router.get('/complaints/outgoingcomplaintsearch/:staffDepartment/:query', subadminController.searchOutgoingComplaints);

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
    ], subadminController.putApproval1);

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
    ], subadminController.putApproval2);

module.exports = router;