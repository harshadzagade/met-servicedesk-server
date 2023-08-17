const Feedback = require("../models/feedback");
const { validationResult } = require("express-validator");

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