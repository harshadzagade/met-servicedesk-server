const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const requestController = require('../controllers/request');
const Department = require('../models/department');

const upload = require('../middleware/uploadfiles');

router.post('/',
    [
        body('staffId')
            .trim()
            .isNumeric().withMessage('Please enter valid staff ID'),
        body('behalf')
            .trim()
            .isBoolean().withMessage('Please provide valid behalf check'),
        body('behalfEmailId')
            .trim()
            .if(body('behalf').equals('true'))
            .isEmail().withMessage('Please enter valid email address')
            .normalizeEmail(),
        body('department')
            .trim()
            .isLength({ min: 1 }).withMessage('Please enter valid department')
            .custom((value) => {
                return Department.findOne({
                    where: {
                        department: value
                    }
                }).then((department) => {
                    if (!department) {
                        return Promise.reject('Department not found');
                    } else {
                        return true;
                    }
                })
            }),
        body('category')
            .trim()
            .isLength({ min: 1 }).withMessage('Please enter valid category')
            .custom((value, { req }) => {
                return Department.findOne({ where: { department: req.body.department } }).then((department) => {
                    if (department.category.includes(value)) {
                        return true;
                    } else {
                        return Promise.reject('Department does not have this category');
                    }
                })
            }),
        body('priority')
            .trim()
            .isLength({ min: 1 }).withMessage('Please select valid priority')
            .custom((value) => {
                if (value !== 'high' && value !== 'moderate' && value !== 'low') {
                    return Promise.reject('Please select valid priority');
                } else {
                    return true;
                }
            }),
        body('subject')
            .trim()
            .isLength({ min: 1 }).withMessage('Please select valid subject'),
        body('description')
            .trim()
            .isLength({ min: 1 }).withMessage('Please select valid description'),
        body('isRepeated')
            .trim()
            .isBoolean().withMessage('Please provide valid repeated check')
    ], upload, requestController.sendRequest);

router.get('/allrequests', requestController.getAllRequests);

router.get('/ownrequests/:staffId', requestController.ownRequests);

router.get('/getrequestdetails/:requestId', requestController.getRequestDetails);

router.get('/requestdepartments', requestController.getRequestDepartments);

router.get('/requestsbydepartment/:department', requestController.getRequestByDepartment);

router.get('/requestcategories', requestController.getRequestCategories);

router.get('/requestsbycategory/:category', requestController.getRequestByCategory);

router.get('/requestsbypriority/:priority', requestController.getRequestByPriority);

router.get('/requestsbystatus/:status', requestController.getRequestByStatus);

router.get('/requestsbyapproval1/:approval', requestController.getRequestByHodApproval);

router.get('/requestsbyapproval2/:approval', requestController.getRequestByAdminApproval);

router.get('/downloadfile/:requestId', requestController.downloadFiles);

module.exports = router;