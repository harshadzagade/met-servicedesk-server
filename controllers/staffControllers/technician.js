const Staff = require("../../models/staff");
const Request = require("../../models/request");
const Complaint = require("../../models/complaint");
const Report = require("../../models/report");
const Op = require('sequelize').Op;
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'siddharthbhat777@gmail.com',
        pass: 'itrflpdafyeavfzd'
    }
});

exports.getTechnician = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role !== 'technician') {
            const error = new Error('Unauthorised staff');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Staff verification successful!', staffId: staff.id })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

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

exports.changeRequestStatus = async (req, res, next) => {
    const requestId = req.params.requestId;
    const statusChange = req.body.status;
    const problemDescription = req.body.problemDescription;
    const actionTaken = req.body.actionTaken;
    try {
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
                    const staff = await Staff.findOne({
                        where: {
                            department: {
                                [Op.contains]: requester.department
                            },
                            role: 'admin'
                        }
                    });
                    if (!staff) {
                        const error = new Error('Staff not found');
                        error.statusCode = 401;
                        throw error;
                    }
                    hodEmail = staff.email;
                }
                await sendMail(requester.email, hodEmail, request.category, request.id, request.subject, request.description, next);
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
    const complaintId = req.params.complaintId;
    const statusChange = req.body.status;
    const problemDescription = req.body.problemDescription;
    const actionTaken = req.body.actionTaken;
    try {
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
                    const staff = await Staff.findOne({
                        where: {
                            department: {
                                [Op.contains]: complainan.department
                            },
                            role: 'admin'
                        }
                    });
                    if (!staff) {
                        const error = new Error('Staff not found');
                        error.statusCode = 401;
                        throw error;
                    }
                    hodEmail = staff.email;
                }
                await sendMail(complainan.email, hodEmail, complaint.category, complaint.id, complaint.subject, complaint.description, next);
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

const sendMail = async (complainanEmail, hodEmail, category, complaintId, subject, description, next) => {
    try {
        await transporter.sendMail({
            to: complainanEmail,
            cc: hodEmail,
            from: 'siddharthbhat777@gmail.com',
            subject: `Complaint regarding ${category} #${complaintId}`,
            html:
                `
            <div class="container" style="max-width: 90%; margin: auto; padding-top: 20px">
                <h2>MET Service Desk</h2>
                <h4>Complaint received ✔</h4>
                <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${subject}</h1>
                <p style="margin-bottom: 30px;">${description}</p>
            </div>
            `
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};