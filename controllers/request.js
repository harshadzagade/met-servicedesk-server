const Request = require('../models/request');
const Staff = require('../models/staff');
const Op = require('sequelize').Op;
const nodemailer = require('nodemailer');
const fs = require('fs');
const archiver = require('archiver');
const Report = require('../models/report');
const { getIO } = require('../socket');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'helpdeskinfo@met.edu',
        pass: 'lzhqhnnscnxiwwqc'
    }
});

exports.sendRequest = async (req, res, next) => {
    const staffId = req.body.staffId;
    let behalf = req.body.behalf || false;
    if (behalf === 'true') {
        behalf = true;
    } else if (behalf === 'false') {
        behalf = false;
    }
    let behalfId = null;
    let requestStaffId = staffId;
    const department = req.body.department;
    const staffDepartment = req.body.staffDepartment;
    const category = req.body.category;
    const priority = req.body.priority;
    const subject = req.body.subject;
    const description = req.body.description;
    let hodEmail;
    let adminEmail;
    let files = [];
    let isRepeated = req.body.isRepeated || false;
    if (isRepeated === 'true') {
        isRepeated = true;
    } else if (isRepeated === 'false') {
        isRepeated = false;
    }
    try {
        if (req.files) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i].path.replace("\\", "/");
                files = files.concat(file);
            }
        }
        if (behalf) {
            const behalfEmailId = req.body.behalfEmailId;
            const staff = await Staff.findOne({ where: { email: behalfEmailId } });
            if (!staff) {
                const error = new Error('Behalf staff not found');
                error.statusCode = 401;
                throw error;
            }
            behalfId = staff.id;
            if (behalfId === staffId) {
                const error = new Error('Cannot use your own email ID as behalf email ID');
                error.statusCode = 401;
                throw error;
            }
            requestStaffId = behalfId;
        }
        const requester = await Staff.findByPk(requestStaffId);
        if (!requester) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        let request;
        if (requester.department.includes(department)) {
            request = new Request({
                staffId: staffId,
                behalf: behalf,
                behalfId: behalfId,
                name: requester.lastname === '' ? requester.firstname : requester.firstname + ' ' + requester.lastname,
                status: 'pending',
                assign: null,
                department: department,
                staffDepartment: staffDepartment,
                category: category,
                priority: priority,
                subject: subject,
                description: description,
                attachment: files,
                approval1: 1,
                approval1Comment: 'Auto approved request',
                isRepeated: isRepeated
            });
        } else {
            request = new Request({
                staffId: staffId,
                behalf: behalf,
                behalfId: behalfId,
                name: requester.lastname === '' ? requester.firstname : requester.firstname + ' ' + requester.lastname,
                status: 'pending',
                assign: null,
                department: department,
                staffDepartment: staffDepartment,
                category: category,
                priority: priority,
                subject: subject,
                description: description,
                attachment: files,
                isRepeated: isRepeated
            });
        }
        if (requester.role !== 'admin' && requester.department.length > 1) {
            const error = new Error('Non-admin staff cannot have multiple department');
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
                const error = new Error('Requested department does not have any admin');
                error.statusCode = 401;
                throw error;
            }
            hodEmail = staff.email;
        }
        const admin = await Staff.findOne({
            where: {
                role: 'admin',
                department: {
                    [Op.contains]: [department]
                }
            }
        });
        if (!admin) {
            const error = new Error('Department or department admin not found');
            error.statusCode = 401;
            throw error;
        }
        const requestRes = await request.save();
        const setId = await Request.findByPk(requestRes.id);
        const currentDate = new Date();
        setId.ticketId = '#' + currentDate.getFullYear() + (String(currentDate.getMonth() + 1).padStart(2, '0')) + setId.id;
        const result = await setId.save();
        let report;
        if (requester.department.includes(department)) {
            report = new Report({
                isRequest: true,
                isComplaint: false,
                requestComplaintId: result.id,
                ticketId: result.ticketId,
                staffName: result.name,
                category: result.category,
                priority: result.priority,
                subject: result.subject,
                description: result.description,
                department: result.department,
                staffDepartment: result.staffDepartment,
                status: result.status,
                loggedTime: result.createdAt,
                approval1Time: new Date(),
                approval1Duration: 0,
                approval1: 1,
                approval1Comment: 'Auto approved request',
                approval1Status: 'approved'
            });
        } else {
            report = new Report({
                isRequest: true,
                isComplaint: false,
                requestComplaintId: result.id,
                ticketId: result.ticketId,
                staffName: result.name,
                category: result.category,
                priority: result.priority,
                subject: result.subject,
                description: result.description,
                department: result.department,
                staffDepartment: result.staffDepartment,
                status: result.status,
                loggedTime: result.createdAt
            });
        }
        await report.save();
        adminEmail = admin.email;
        await sendMail(hodEmail, adminEmail, category, result.ticketId, subject, description, next);
        getIO().emit('requests');
        res.status(201).json({ message: 'Staff created!', request: result });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getAllRequests = async (req, res, next) => {
    try {
        const requests = await Request.findAll();
        res.status(200).json({ message: 'Fetched all requests successfully.', requests: requests });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.searchAllRequests = async (req, res, next) => {
    const query = req.params.query;
    try {
        const request = await Request.findAll({
            where: {
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

exports.getRequestsFromDepartment = async (id, department, next) => {
    try {
        const staffs = await Staff.findAll({
            where: {
                department: {
                    [Op.contains]: [department]
                },
                id: {
                    [Op.ne]: id
                }
            }
        });
        let allRequests = [];
        for (let i = 0; i < staffs.length; i++) {
            const singleStaff = staffs[i];
            const requests = await Request.findAll({
                where: {
                    staffId: singleStaff.id
                }
            });
            allRequests = allRequests.concat(requests);
        }
        return allRequests;
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getRequestsToDepartment = async (department, next) => {
    try {
        const requests = await Request.findAll({
            where: {
                department: department
            }
        });
        return requests;
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.ownRequests = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        const requests = await Request.findAll({
            where: {
                [Op.or]: [
                    { staffId: staffId },
                    { category: 'general' }
                ]
            }
        });
        res.status(200).json({ message: 'Staff created!', requests: requests });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.searchOwnRequests = async (req, res, next) => {
    const staffId = req.params.staffId;
    const query = req.params.query;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        const request = await Request.findAll({
            where: {
                staffId: staffId,
                [Op.or]: [
                    { ticketId: { [Op.iLike]: `%${query}%` } },
                    { subject: { [Op.iLike]: `%${query}%` } },
                    { description: { [Op.iLike]: `%${query}%` } },
                    { name: { [Op.iLike]: `%${query}%` } },
                    { department: { [Op.iLike]: `%${query}%` } },
                    { category: { [Op.iLike]: `%${query}%` } },
                    { priority: { [Op.iLike]: `%${query}%` } },
                    { status: { [Op.iLike]: `%${query}%` } }
                ]
            }
        });
        res.json(request);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getRequestDetails = async (req, res, next) => {
    const requestId = req.params.requestId;
    try {
        const request = await Request.findByPk(requestId);
        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Request fetched successfully!', request: request });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getRequestByDepartment = async (req, res, next) => {
    const department = req.params.department;
    try {
        const requests = await Request.findAll({
            where: {
                department: department
            }
        });
        if (!requests) {
            const error = new Error('Requests not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Requests fetched successfully', requests: requests });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.searchRequestsByDepartment = async (req, res, next) => {
    const department = req.params.department;
    const query = req.params.query;
    try {
        const request = await Request.findAll({
            where: {
                department: department,
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

exports.downloadFiles = async (req, res, next) => {
    const requestId = req.params.requestId;
    try {
        const request = await Request.findByPk(requestId);
        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 401;
            throw error;
        }
        const zipStream = archiver('zip', {
            zlib: { level: 9 }
        });
        zipStream.pipe(res);
        request.attachment.forEach((filePath) => {
            const fileStream = fs.createReadStream(filePath);
            zipStream.append(fileStream, { name: filePath });
        });
        zipStream.finalize();
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

const sendMail = async (hodEmail, adminEmail, category, requestId, subject, description, next) => {
    try {
        if (hodEmail === adminEmail) {
            await transporter.sendMail({
                to: hodEmail,
                from: 'helpdeskinfo@met.edu',
                subject: `Requested ${category} ${requestId}`,
                html:
                    `
                    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                        <div style="background-color: #DA251C; color: #ffffff; text-align: center; padding: 10px; border-top-left-radius: 5px; border-top-right-radius: 5px;">
                        <h1>MET Helpdesk</h1>
                        </div>
                        <div style="padding: 20px;">
                        <h2 style="color: #0088cc;">Helpdesk Ticket Notification</h2>
                        <p>Dear Admin,</p>
                        <p>A new ticket has been generated with the following details:</p>
                        <table style="width: 100%;">
                            <tr>
                                <td style="padding: 5px; font-weight: bold;">Ticket ID:</td>
                                <td style="padding: 5px;">${requestId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px; font-weight: bold;">Ticket Type:</td>
                                <td style="padding: 5px;">Request</td>
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
                        <p>Please log in to the helpdesk system to review and assign the ticket.</p>
                        <p>If you have any questions or need assistance, feel free to contact our support team.</p>
                        <p>Best regards,<br> The Helpdesk Team</p>
                        </div>
                        <div style="text-align: center; padding: 10px; background-color: #f4f4f4; border-bottom-left-radius: 5px; border-bottom-right-radius: 5px;">
                        <p>This is an automated email. Please do not reply.</p>
                        </div>
                    </div>
                </body>
            `
            });
        } else {
            transporter.sendMail({
                to: [hodEmail, adminEmail],
                from: 'helpdeskinfo@met.edu',
                subject: `Requested ${category} ${requestId}`,
                html:
                    `
                    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                        <div style="background-color: #DA251C; color: #ffffff; text-align: center; padding: 10px; border-top-left-radius: 5px; border-top-right-radius: 5px;">
                        <h1>MET Helpdesk</h1>
                        </div>
                        <div style="padding: 20px;">
                        <h2 style="color: #0088cc;">Helpdesk Ticket Notification</h2>
                        <p>Dear Admin,</p>
                        <p>A new ticket has been generated with the following details:</p>
                        <table style="width: 100%;">
                            <tr>
                                <td style="padding: 5px; font-weight: bold;">Ticket ID:</td>
                                <td style="padding: 5px;">${requestId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px; font-weight: bold;">Ticket Type:</td>
                                <td style="padding: 5px;">Request</td>
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
                        <p>Please log in to the helpdesk system to review and assign the ticket.</p>
                        <p>If you have any questions or need assistance, feel free to contact our support team.</p>
                        <p>Best regards,<br> The Helpdesk Team</p>
                        </div>
                        <div style="text-align: center; padding: 10px; background-color: #f4f4f4; border-bottom-left-radius: 5px; border-bottom-right-radius: 5px;">
                        <p>This is an automated email. Please do not reply.</p>
                        </div>
                    </div>
                </body>
            `
            });
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

const formatMonthWithLeadingZero = (month) => {
    return String(month).padStart(2, '0');
  }
  