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
        })
    ], feedbackController.postFeedback);

router.get('/requestfeedbacks/:department', feedbackController.getAllDepartmentFeedbacks);

module.exports = router;