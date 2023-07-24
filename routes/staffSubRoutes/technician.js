const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const technicianController = require('../../controllers/staffControllers/technician');

router.get('/:staffId', technicianController.getTechnician);

router.get('/getassignedrequests/:staffId', technicianController.getAssignedRequests);

router.put('/changerequeststatus/:requestId',
    [
        body('status')
            .trim()
            .isLength({ min: 1 }).withMessage('Please select valid status')
            .custom((value) => {
                if (value !== 'attending' && value !== 'closed' && value !== 'forwarded') {
                    return Promise.reject('Please select valid status');
                } else {
                    return true;
                }
            }),
        body('assign')
            .if(body('status').equals('forwarded'))
            .trim()
            .isLength({ min: 1 }).withMessage('Please enter valid technician ID')
            .isNumeric().withMessage('Please enter valid technician ID'),
        body('problemDescription')
            .custom((value, { req }) => {
                const status = req.body.status;
                if (status === 'closed' || status === 'forwarded') {
                    if (value.trim().length < 1) {
                        return Promise.reject('Please select valid problem description statement');
                    } else {
                        return true;
                    }
                }
            }),
        body('actionTaken')
            .custom((value, { req }) => {
                const status = req.body.status;
                if (status === 'closed' || status === 'forwarded') {
                    if (value.trim().length < 1) {
                        return Promise.reject('Please select valid action taken statement');
                    } else {
                        return true;
                    }
                }
            }),
        body('forwardComment')
            .if(body('status').equals('forwarded'))
            .trim()
            .isLength({ min: 1 }).withMessage('Please enter valid forward comment')
    ], technicianController.changeRequestStatus);

router.put('/selfassigncomplaint/:complaintId/:staffId', technicianController.selfAssignComplaint);

router.put('/changecomplaintstatus/:complaintId',
    [
        body('status')
            .trim()
            .isLength({ min: 1 }).withMessage('Please select valid status')
            .custom((value) => {
                if (value !== 'closed' && value !== 'forwarded') {
                    return Promise.reject('Please select valid status');
                } else {
                    return true;
                }
            }),
        body('assign')
            .if(body('status').equals('forwarded'))
            .trim()
            .isLength({ min: 1 }).withMessage('Please enter valid technician ID')
            .isNumeric().withMessage('Please enter valid technician ID'),
        body('problemDescription')
            .custom((value, { req }) => {
                const status = req.body.status;
                if (status === 'closed' || status === 'forwarded') {
                    if (value.trim().length < 1) {
                        return Promise.reject('Please select valid problem description statement');
                    } else {
                        return true;
                    }
                }
            }),
        body('actionTaken')
            .custom((value, { req }) => {
                const status = req.body.status;
                if (status === 'closed' || status === 'forwarded') {
                    if (value.trim().length < 1) {
                        return Promise.reject('Please select valid action taken statement');
                    } else {
                        return true;
                    }
                }
            }),
        body('forwardComment')
            .if(body('status').equals('forwarded'))
            .trim()
            .isLength({ min: 1 }).withMessage('Please enter valid forward comment')
    ], technicianController.changeComplaintStatus);

router.get('/techniciandepartmenttechnicians/:staffId/:currentDepartment', technicianController.getDepartmentTechnicians);

module.exports = router;