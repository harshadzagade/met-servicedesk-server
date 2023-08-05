const Staff = require("../../models/staff");
const Request = require("../../models/request");
const Complaint = require("../../models/complaint");
const Report = require("../../models/report");
const Op = require('sequelize').Op;
const nodemailer = require('nodemailer');
const { validationResult } = require("express-validator");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'helpdeskinfo@met.edu',
        pass: 'lzhqhnnscnxiwwqc'
    }
});

exports.getAssignedRequests = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const requests = await Request.findAll({
            where: {
                assign: staffId
            }
        });
        res.status(200).json({ message: 'Requests fetched successfully!', requests: requests })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.searchAssignedRequests = async (req, res, next) => {
    const staffId = req.params.staffId;
    const query = req.params.query;
    try {
        const request = await Request.findAll({
            where: {
                assign: staffId,
                [Op.or]: [
                    { ticketId: { [Op.iLike]: `%${query}%` } },
                    { subject: { [Op.iLike]: `%${query}%` } },
                    { description: { [Op.iLike]: `%${query}%` } },
                    { name: { [Op.iLike]: `%${query}%` } },
                    { department: { [Op.iLike]: `%${query}%` } },
                    { category: { [Op.iLike]: `%${query}%` } },
                    { priority: { [Op.iLike]: `%${query}%` } },
                    { status: { [Op.iLike]: `%${query}%` } }
                ],
            },
        });
        res.json(request);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.changeRequestStatus = async (req, res, next) => {
    const errors = validationResult(req);
    const requestId = req.params.requestId;
    const statusChange = req.body.status;
    const problemDescription = req.body.problemDescription;
    const actionTaken = req.body.actionTaken;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const request = await Request.findByPk(requestId);
        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 401;
            throw error;
        }
        let assign = request.assign;
        const staff = await Staff.findByPk(assign);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.department[0] !== request.department) {
            const error = new Error('Staff does not belong to expected department');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role !== 'technician') {
            const error = new Error('Staff other than technicians cannot forward requests');
            error.statusCode = 401;
            throw error;
        }
        let report;
        switch (statusChange) {
            case 'attending':
                request.status = 'attending';
                report = await Report.findOne({ where: { requestComplaintId: request.id } });
                report.attendedTime = new Date();
                report.attendDuration = report.attendedTime - report.assignedTime;
                await report.save();
                break;

            case 'closed':
                if (request.status !== 'attending') {
                    const error = new Error('Cannot close request before attending');
                    error.statusCode = 401;
                    throw error;
                }
                request.status = 'closed';
                request.problemDescription = problemDescription;
                request.actionTaken = actionTaken;
                report = await Report.findOne({ where: { requestComplaintId: request.id } });
                report.status = 'closed';
                report.lastUpdatedTime = new Date();
                report.lastUpdateDuration = report.lastUpdatedTime - report.attendedTime;
                report.problemDescription = problemDescription;
                report.actionTaken = actionTaken;
                await report.save();
                let hodEmail;
                let requesterId = request.staffId;
                if (request.behalf) {
                    requesterId = request.behalfId;
                }
                const requester = await Staff.findByPk(requesterId);
                if (!requester) {
                    const error = new Error('Staff not found');
                    error.statusCode = 401;
                    throw error;
                }
                if (requester.role === 'admin') {
                    hodEmail = requester.email;
                } else {
                    const admin = await Staff.findOne({
                        where: {
                            department: {
                                [Op.contains]: requester.department
                            },
                            role: 'admin'
                        }
                    });
                    if (!admin) {
                        const error = new Error('Department admin not found');
                        error.statusCode = 401;
                        throw error;
                    }
                    hodEmail = admin.email;
                }
                await sendMail('Request', requester.email, hodEmail, request.category, request.ticketId, request.subject, request.description, next);
                break;

            case 'forwarded':
                if (request.status !== 'attending') {
                    const error = new Error('Cannot forwared request before attending');
                    error.statusCode = 401;
                    throw error;
                }
                request.status = 'forwarded';
                assign = req.body.assign;
                const forwardComment = req.body.forwardComment;
                if (request.assign === assign) {
                    const error = new Error('Same staff is already assigned');
                    error.statusCode = 401;
                    throw error;
                }
                const staff = await Staff.findByPk(assign);
                if (!staff) {
                    const error = new Error('Staff not found');
                    error.statusCode = 401;
                    throw error;
                }
                if (staff.role !== 'technician') {
                    const error = new Error('Staff is not a technician');
                    error.statusCode = 401;
                    throw error;
                }
                if (staff.department[0] !== request.department) {
                    const error = new Error('Staff does not belong to expected department');
                    error.statusCode = 401;
                    throw error;
                }
                if (assign) {
                    request.assign = assign;
                    request.assignedName = staff.firstname + ' ' + staff.lastname;
                    request.forwardComment = forwardComment;
                    request.problemDescription = problemDescription;
                    request.actionTaken = actionTaken;
                    report = await Report.findOne({ where: { requestComplaintId: request.id } });
                    report.status = 'forwarded';
                    report.lastUpdatedTime = new Date();
                    report.lastUpdateDuration = report.lastUpdatedTime - report.attendedTime;
                    report.problemDescription = problemDescription;
                    report.actionTaken = actionTaken;
                    await report.save();
                } else {
                    const error = new Error('Forwarded staff not found');
                    error.statusCode = 401;
                    throw error;
                }
                break;

            default:
                const error = new Error('Invalid status input');
                error.statusCode = 401;
                throw error;
        }
        const result = await request.save();
        res.status(200).json({ message: 'status updated successfully!', request: result });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.selfAssignComplaint = async (req, res, next) => {
    const complaintId = req.params.complaintId;
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        const complaint = await Complaint.findByPk(complaintId);
        if (!complaint) {
            const error = new Error('Complaint not found');
            error.statusCode = 401;
            throw error;
        }
        if (complaint.assign !== null) {
            const error = new Error('Complaint already assigned');
            error.statusCode = 401;
            throw error;
        }
        if (staff.department[0] !== complaint.department) {
            const error = new Error('Staff does not belong to expected department');
            error.statusCode = 401;
            throw error;
        }
        complaint.status = 'attending';
        complaint.assign = staffId;
        complaint.assignedName = staff.firstname + ' ' + staff.lastname;
        const reportCheck = await Report.findOne({
            where: {
                requestComplaintId: complaint.id,
                staffId: staffId
            }
        });
        let report;
        if (reportCheck) {
            report = await Report.findByPk(reportCheck.id);
            report.isRequest = false;
            report.isComplaint = true;
            report.requestComplaintId = complaint.id;
            report.staffId = staffId;
            report.staffName = complaint.name;
            report.assignedName = staff.firstname + ' ' + staff.lastname;
            report.category = complaint.category;
            report.priority = complaint.priority;
            report.subject = complaint.subject;
            report.description = complaint.description;
            report.department = complaint.department;
            report.staffDepartment = complaint.staffDepartment;
            report.status = complaint.status;
            report.loggedTime = complaint.createdAt;
            report.attendedTime = new Date();
            report.attendDuration = new Date() - complaint.createdAt;
        } else {
            report = new Report({
                isRequest: false,
                isComplaint: true,
                requestComplaintId: complaint.id,
                staffId: staffId,
                staffName: complaint.name,
                assignedName: staff.firstname + ' ' + staff.lastname,
                category: complaint.category,
                priority: complaint.priority,
                subject: complaint.subject,
                description: complaint.description,
                department: complaint.department,
                staffDepartment: complaint.staffDepartment,
                status: complaint.status,
                loggedTime: complaint.createdAt,
                attendedTime: new Date(),
                attendDuration: new Date() - complaint.createdAt
            });
        }
        await report.save();
        const result = await complaint.save();
        res.status(200).json({ message: 'Task self assigned successfully!', complaint: result })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.changeComplaintStatus = async (req, res, next) => {
    const errors = validationResult(req);
    const complaintId = req.params.complaintId;
    const statusChange = req.body.status;
    const problemDescription = req.body.problemDescription;
    const actionTaken = req.body.actionTaken;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const complaint = await Complaint.findByPk(complaintId);
        if (!complaint) {
            const error = new Error('Complaint not found');
            error.statusCode = 401;
            throw error;
        }
        let assign = complaint.assign;
        const staff = await Staff.findByPk(assign);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.department[0] !== complaint.department) {
            const error = new Error('Staff does not belong to expected department');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role !== 'technician') {
            const error = new Error('Staff other than technicians cannot forward complaints');
            error.statusCode = 401;
            throw error;
        }
        let report;
        switch (statusChange) {
            case 'closed':
                complaint.status = 'closed';
                complaint.problemDescription = problemDescription;
                complaint.actionTaken = actionTaken;
                report = await Report.findOne({ where: { requestComplaintId: complaint.id } });
                report.status = 'closed';
                report.lastUpdatedTime = new Date();
                report.lastUpdateDuration = report.lastUpdatedTime - report.attendedTime;
                report.problemDescription = problemDescription;
                report.actionTaken = actionTaken;
                await report.save();
                let hodEmail;
                let complainanId = complaint.staffId;
                if (complaint.behalf) {
                    complainanId = complaint.behalfId;
                }
                const complainan = await Staff.findByPk(complainanId);
                if (!complainan) {
                    const error = new Error('Staff not found');
                    error.statusCode = 401;
                    throw error;
                }
                if (complainan.role === 'admin') {
                    hodEmail = complainan.email;
                } else {
                    const admin = await Staff.findOne({
                        where: {
                            department: {
                                [Op.contains]: complainan.department
                            },
                            role: 'admin'
                        }
                    });
                    if (!admin) {
                        const error = new Error('Department admin not found');
                        error.statusCode = 401;
                        throw error;
                    }
                    hodEmail = admin.email;
                }
                await sendMail('Concern', complainan.email, hodEmail, complaint.category, complaint.ticketId, complaint.subject, complaint.description, next);
                break;

            case 'forwarded':
                complaint.status = 'forwarded';
                assign = req.body.assign;
                const forwardComment = req.body.forwardComment;
                if (complaint.assign === assign) {
                    const error = new Error('Same staff is already assigned');
                    error.statusCode = 401;
                    throw error;
                }
                const staff = await Staff.findByPk(assign);
                if (!staff) {
                    const error = new Error('Staff not found');
                    error.statusCode = 401;
                    throw error;
                }
                if (staff.role !== 'technician') {
                    const error = new Error('Staff is not a technician');
                    error.statusCode = 401;
                    throw error;
                }
                if (staff.department[0] !== complaint.department) {
                    const error = new Error('Staff does not belong to expected department');
                    error.statusCode = 401;
                    throw error;
                }
                if (assign) {
                    complaint.assign = assign;
                    complaint.assignedName = staff.firstname + ' ' + staff.lastname;
                    complaint.forwardComment = forwardComment;
                    complaint.problemDescription = problemDescription;
                    complaint.actionTaken = actionTaken;
                    report = await Report.findOne({ where: { requestComplaintId: complaint.id } });
                    report.status = 'forwarded';
                    report.lastUpdatedTime = new Date();
                    report.lastUpdateDuration = report.lastUpdatedTime - report.attendedTime;
                    report.problemDescription = problemDescription;
                    report.actionTaken = actionTaken;
                    await report.save();
                } else {
                    const error = new Error('Forwarded staff not found');
                    error.statusCode = 401;
                    throw error;
                }
                break;

            default:
                const error = new Error('Invalid status input');
                error.statusCode = 401;
                throw error;
        }
        const result = await complaint.save();
        res.status(200).json({ message: 'status updated successfully!', complaint: result });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getDepartmentTechnicians = async (req, res, next) => {
    const staffId = req.params.staffId;
    const currentDepartment = req.params.currentDepartment;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role === 'technician') {
            const department = currentDepartment;
            const technicians = await Staff.findAll({ where: { department: [department], role: 'technician', id: { [Op.ne]: [staffId] } } });
            res.status(200).json({ message: 'Fetched all technicians as per specific department successfully.', technicians: technicians });
        } else {
            const error = new Error('Invalid admin id');
            error.statusCode = 401;
            throw error;
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

const sendMail = async (ticketType, ticketRaiserEmail, hodEmail, category, ticketId, subject, description, next) => {
    try {
        const staff = await Staff.findOne({ where: { email: ticketRaiserEmail } });
        if (!staff) {
            const error = new Error('Ticket raiser not found');
            error.statusCode = 401;
            throw error;
        }
        await transporter.sendMail({
            to: ticketRaiserEmail,
            cc: hodEmail,
            from: 'helpdeskinfo@met.edu',
            subject: `${ticketType} regarding ${category} ${ticketId}`,
            html:
                `
                <body style="font-family: Arial, sans-serif; background-color: #f1f1f1; padding: 20px;">
                <div style="background-color: #ffffff; border-radius: 5px; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0088cc;">Ticket Closure Notification</h2>
                    <p>Dear ${staff.firstname},</p>
                    <p>We are pleased to inform you that your helpdesk ticket (ID: ${ticketId}) has been successfully resolved and closed.</p>
                    <p>Issue Details:</p>
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 5px; font-weight: bold;">Ticket Type:</td>
                            <td style="padding: 5px;">${ticketType}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; font-weight: bold;">Issue Category:</td>
                            <td style="padding: 5px;">${category}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; font-weight: bold;">Subject:</td>
                            <td style="padding: 5px;">${subject}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; font-weight: bold;">Description:</td>
                            <td style="padding: 5px;">${description}</td>
                        </tr>
                    </table>
                    <p>We appreciate your patience and cooperation throughout the resolution process. If you have any further questions or concerns, please don't hesitate to contact us.</p>
                    <p>Thank you for using our helpdesk services!</p>
                    <p>Best regards,</p>
                    <p>The Helpdesk Team</p>
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