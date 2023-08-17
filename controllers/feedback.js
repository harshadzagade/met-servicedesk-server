const Feedback = require("../models/feedback");

exports.postFeedback = async (req, res, next) => {
    const ticketId = req.body.ticketId;
    const ticketType = req.body.ticketType;
    const feedbackMessage = req.body.feedback;
    try {
        const feedback = new Feedback({
            ticketId: ticketId,
            ticketType: ticketType,
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