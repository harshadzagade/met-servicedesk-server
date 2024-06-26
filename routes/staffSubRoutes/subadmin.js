const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const subadminController = require('../../controllers/staffControllers/subadmin');

router.get('/allstaff/:staffId/:currentDepartment', subadminController.getAllStaff);

router.get('/searchalldepartmentstaff/:currentDepartment/:query', subadminController.searchDepartmentStaff);

router.put('/staffdetails/updateStaff/:staffId',
    [
        body('role')
            .isLength({ min: 1 }).withMessage('Please select valid role')
            .custom((value) => {
                if (value === 'superadmin' || value === 'admin') {
                    return Promise.reject('Not allowed to edit role of admin or super-admin');
                } else if (value !== 'engineer' && value !== 'user') {
                    return Promise.reject('Please select valid role');
                } else {
                    return true;
                }
            })
            .trim()
    ], subadminController.updateStaff);

router.put('/assigncomplaint/:complaintId', subadminController.assignComplaint);

router.get('/subadmindepartmenttechnicians/:staffId/:currentDepartment', subadminController.getDepartmentTechnicians);

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