const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const feedbackController = require('../controllers/feedback');
const Request = require('../models/request');
const Complaint = require('../models/complaint');

router.post('/',
    [
        body('ticketType').custom(async (value, { req }) => {
            const ticketId = req.body.ticketId;
            switch (value) {
                case 'request':
                    const request = await Request.findOne({ where: { ticketId: ticketId } });
                    if (!request) {
                        return Promise.reject('No such ticket found');
                    } else if (request.status !== 'closed') {
                        return Promise.reject('Cannot submit feedback before ticket closure');
                    }
                    break;

                case 'complaint':
                    const complaint = await Complaint.findOne({ where: { ticketId: ticketId } });
                    if (!complaint) {
                        return Promise.reject('No such ticket found');
                    } else if (complaint.status !== 'closed') {
                        return Promise.reject('Cannot submit feedback before ticket closure');
                    }
                    break;

                default:
                    return Promise.reject('Invalid ticket type');
            }
        }),
        body('feedback')
            .isLength({ max: 150 }).withMessage('Cannot exceed above 150 characters')
            .isLength({ min: 1 }).withMessage('Please enter feedback before submitting')
    ], feedbackController.postFeedback);

router.get('/allfeedbacks/:department', feedbackController.getAllDepartmentFeedbacks);

router.get('/feedbacksearch/:department/:query', feedbackController.searchFeedback);

module.exports = router;