const Feedback = require("../models/feedback");
const { validationResult } = require("express-validator");
const Request = require("../models/request");
const Complaint = require("../models/complaint");
const Staff = require("../models/staff");
const nodemailer = require('nodemailer');
const { Op } = require("sequelize");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'helpdeskinfo@met.edu',
        pass: 'lzhqhnnscnxiwwqc'
    }
});

exports.postFeedback = async (req, res, next) => {
    const errors = validationResult(req);
    const ticketType = req.body.ticketType;
    const ticketId = req.body.ticketId;
    const department = req.body.department;
    const feedbackMessage = req.body.feedback;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const existingFeedback = await Feedback.findOne({
            where: {
                ticketType: ticketType,
                ticketId: ticketId
            }
        });
        if (existingFeedback) {
            const error = new Error('Feedback can be only submitted once');
            error.statusCode = 403;
            throw error;
        }
        const feedback = new Feedback({
            ticketType: ticketType,
            ticketId: ticketId,
            department: department,
            feedback: feedbackMessage
        });
        let staffId;
        if (ticketType === 'request') {
            const request = await Request.findOne({ where: { ticketId: ticketId } });
            staffId = request.staffId;
        } else {
            const complaint = await Complaint.findOne({ where: { ticketId: ticketId } });
            staffId = complaint.staffId;
        }
        const admin = await Staff.findOne({
            where: {
                department: [department],
                role: 'admin'
            }
        });
        if (!admin) {
            const error = new Error('Department admin not found');
            error.statusCode = 401;
            throw error;
        }
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        await sendFeedBackMail(admin.email, ticketType === 'request' ? 'Request' : 'Concern', ticketId, staff.firstname + ' ' + staff.lastname, staff.email, feedbackMessage, getFormattedDate(new Date()), next);
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
        const feedback = await Feedback.findAll({ where: { department: department } });
        res.status(200).json({ message: 'Fetched all department feedback successfully', feedback: feedback });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.searchFeedback = async (req, res, next) => {
    const department = req.params.department;
    const query = req.params.query;
    try {
        const feedback = await Feedback.findAll({
            where: {
                department: department,
                [Op.or]: [
                    { ticketType: { [Op.iLike]: `%${query}%` } },
                    { ticketId: { [Op.iLike]: `%${query}%` } },
                    { feedback: { [Op.iLike]: `%${query}%` } },
                ]
            }
        });
        res.json(feedback);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

const sendFeedBackMail = async (adminEmail, ticketType, ticketId, staffName, staffEmail, feedback, feedbackDate, next) => {
    try {
        await transporter.sendMail({
            to: adminEmail,
            from: 'helpdeskinfo@met.edu',
            subject: `New feedback on ticket ${ticketId}`,
            html:
                `
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                    <div style="max-width: 600px; margin: 20px auto;">
                        <div style="background-color: #DA251C; border-radius: 10px; padding: 20px; color: #ffffff;">
                            <h2 style="margin-top: 0; font-size: 28px;">New Feedback on <span style="text-transform: capitalize;">${ticketType}</span> Ticket with ID <span style="text-transform: uppercase;">${ticketId}</span></h2>
                        </div>
                        <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); color: #333;">
                            <p>Hello Admin,</p>
                            <p>A new feedback ticket has been submitted by a user. Here are the details:</p>
                            <ul style="list-style-type: none; padding: 0;">
                                <li style="margin-bottom: 10px;"><strong>User:</strong> ${staffName}</li>
                                <li style="margin-bottom: 10px;"><strong>Email:</strong> ${staffEmail}</li>
                                <li style="margin-bottom: 10px;"><strong>Feedback:</strong> ${feedback}</li>
                                <li style="margin-bottom: 10px;"><strong>Ticket ID:</strong> ${ticketId}</li>
                                <li style="margin-bottom: 10px;"><strong>Ticket Type:</strong> ${ticketType}</li>
                                <li style="margin-bottom: 10px;"><strong>Date:</strong> ${feedbackDate}</li>
                            </ul>
                            <p style="margin-bottom: 15px;">This feedback is regarding a <strong>${ticketType}</strong> ticket with ID <strong>${ticketId}</strong>.</p>
                            <p style="margin-bottom: 15px;">Please review this feedback ticket and take appropriate action.</p>
                            <p style="margin-bottom: 15px;">Thank you!</p>
                            <p style="text-align: center; color: #777;">Best regards,<br>The Helpdesk Team</p>
                        </div>
                    </div>
                </body>
            `
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

const getFormattedDate = (rawDate) => {
    if (rawDate === null) {
        return null;
    }
    const date = new Date(rawDate);
    return (date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + formatAMPM(date));
};

const formatAMPM = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    let strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
    return strTime;
};