const Feedback = require("../models/feedback");
const { validationResult } = require("express-validator");
const Request = require("../models/request");
const Complaint = require("../models/complaint");

exports.postFeedback = async (req, res, next) => {
    const errors = validationResult(req);
    const ticketType = req.body.ticketType;
    const ticketId = req.body.ticketId;
    const feedbackMessage = req.body.feedback;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const feedback = new Feedback({
            ticketType: ticketType,
            ticketId: ticketId,
            feedback: feedbackMessage
        });
        const result = await feedback.save();
        res.status(201).json({ message: 'Feedback sent successfully', feedback: result });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getAllDepartmentFeedbacks = async (req, res, next) => {
    const department = req.params.department;
    try {
        const requests = await Request.findAll({
            where: { department: department },
            attributes: ['ticketId']
        });
        const complaints = await Complaint.findAll({
            where: { department: department },
            attributes: ['ticketId']
        });
        let allFeedbacks = [];
        for (let index = 0; index < requests.length; index++) {
            const element = requests[index].ticketId;
            const feedback = await Feedback.findOne({ where: { ticketId: element, ticketType: 'request' } });
            if (feedback) {
                allFeedbacks.push(feedback);
            }
        }
        for (let index = 0; index < complaints.length; index++) {
            const element = complaints[index].ticketId;
            const feedback = await Feedback.findOne({ where: { ticketId: element, ticketType: 'complaint' } });
            if (feedback) {
                allFeedbacks.push(feedback);
            }
        }
        res.status(200).json({ message: 'Fetched all department feedback successfully', feedback: allFeedbacks });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};