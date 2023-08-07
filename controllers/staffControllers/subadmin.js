const Staff = require("../../models/staff");
const { getRequestsToDepartment } = require("../request");
const Op = require('sequelize').Op;
const Request = require("../../models/request");
const nodemailer = require('nodemailer');
const Report = require("../../models/report");
const { validationResult } = require("express-validator");
const { Sequelize } = require("sequelize");
const Complaint = require("../../models/complaint");
const SubadminActivities = require("../../models/subadminactivities");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'helpdeskinfo@met.edu',
        pass: 'lzhqhnnscnxiwwqc'
    }
});

exports.getAllStaff = async (req, res, next) => {
    const staffId = req.params.staffId;
    const currentDepartment = req.params.currentDepartment;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role === 'subadmin') {
            const department = currentDepartment;
            const totalStaff = await Staff.findAll({ where: { department: [department], role: { [Op.notIn]: ['subadmin', 'admin'] } } });
            res.status(200).json({ message: 'Fetched all staff as per specific department successfully.', totalStaff: totalStaff });
        } else {
            const error = new Error('Invalid sub-admin id');
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

exports.searchDepartmentStaff = async (req, res, next) => {
    const query = req.params.query;
    const currentDepartment = req.params.currentDepartment;
    try {
        const staff = await Staff.findAll({
            where: {
                department: { [Op.contains]: [currentDepartment] },
                role: { [Op.notIn]: ['subadmin', 'admin'] },
                [Op.or]: [
                    { firstname: { [Op.iLike]: `%${query}%` } },
                    { middlename: { [Op.iLike]: `%${query}%` } },
                    { lastname: { [Op.iLike]: `%${query}%` } },
                    { email: { [Op.iLike]: `%${query}%` } },
                    { role: { [Op.iLike]: `%${query}%` } },
                    { institute: { [Op.iLike]: `%${query}%` } },
                    { contactExtension: { [Op.iLike]: `%${query}%` } },
                    Sequelize.where(
                        Sequelize.cast(Sequelize.col('phoneNumber'), 'TEXT'),
                        { [Op.iLike]: `%${query}%` }
                    )
                ],
            },
        });
        res.json(staff);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.updateStaff = async (req, res, next) => {
    const errors = validationResult(req);
    const staffId = req.params.staffId;
    const subadminId = req.body.subadminId;
    const role = req.body.role;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const subadmin = await Staff.findByPk(subadminId);
        if (!subadmin) {
            const error = new Error('Department subadmin not found');
            error.statusCode = 401;
            throw error;
        }
        const admin = await Staff.findOne({
            where: {
                department: { [Op.contains]: subadmin.department },
                role: 'admin'
            }
        });
        if (!admin) {
            const error = new Error('Department admin not found');
            error.statusCode = 401;
            throw error;
        }
        const subadminActivities = await SubadminActivities.findOne({
            where: {
                adminId: admin.id
            }
        });
        if (!subadminActivities) {
            const error = new Error('Subadmin activities not found');
            error.statusCode = 401;
            throw error;
        }
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        subadminActivities.activities = subadminActivities.activities !== null ? subadminActivities.activities.concat([{ activity: `Role of staff ${staff.firstname + ' ' + staff.lastname} has been changed from ${staff.role} to ${role}`, dateTime: new Date() }]) : [{ activity: `Role of staff ${staff.firstname + ' ' + staff.lastname} has been changed from ${staff.role} to ${role}`, dateTime: new Date() }];
        await sendSubadminActivityMail(admin.email, 'Staff role changed', subadmin.firstname + ' ' + subadmin.lastname, `Role of staff ${staff.firstname + ' ' + staff.lastname} has been changed from ${staff.role} to ${role}`, getFormattedDate(new Date()));
        staff.role = role;
        if (staff.role === '' || staff.role === null) {
            staff.role = 'user';
            await staff.save();
        }
        const result = await staff.save();
        await subadminActivities.save();
        res.status(200).json({ message: 'Staff details updated', staff: result });
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
        if (staff.role === 'subadmin') {
            const department = currentDepartment;
            const technicians = await Staff.findAll({ where: { department: [department], role: 'technician' } });
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

exports.getOutgoingRequests = async (req, res, next) => {
    const staffId = req.params.staffId;
    const department = req.params.department;
    try {
        const subadmin = await Staff.findByPk(staffId);
        if (!subadmin) {
            const error = new Error('Subadmin not found');
            error.statusCode = 401;
            throw error;
        }
        const admin = await Staff.findOne({
            where: {
                department: { [Op.contains]: subadmin.department },
                role: 'admin'
            }
        });
        if (!admin) {
            const error = new Error('Department admin not found');
            error.statusCode = 401;
            throw error;
        }
        const requests = await Request.findAll({
            where: {
                staffDepartment: department,
                staffId: { [Op.notIn]: [subadmin.id, admin.id] }
            }
        });
        res.status(200).json({ message: 'Fetched all requests successfully.', requests: requests });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.searchOutgoingRequests = async (req, res, next) => {
    const staffDepartment = req.params.staffDepartment;
    const query = req.params.query;
    try {
        const subadmin = await Staff.findOne({
            where: {
                department: { [Op.contains]: [staffDepartment] },
                role: 'subadmin'
            }
        });
        if (!subadmin) {
            const error = new Error('Department subadmin not found');
            error.statusCode = 401;
            throw error;
        }
        const admin = await Staff.findOne({
            where: {
                department: { [Op.contains]: subadmin.department },
                role: 'admin'
            }
        });
        if (!admin) {
            const error = new Error('Department admin not found');
            error.statusCode = 401;
            throw error;
        }
        const request = await Request.findAll({
            where: {
                staffDepartment: staffDepartment,
                staffId: { [Op.notIn]: [subadmin.id, admin.id] },
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

exports.getIncomingRequests = async (req, res, next) => {
    const department = req.params.department;
    try {
        const requests = await getRequestsToDepartment(department, next);
        res.status(200).json({ message: 'Fetched all requests successfully.', requests: requests });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.searchIncomingRequests = async (req, res, next) => {
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

exports.getOutgoingComplaints = async (req, res, next) => {
    const staffId = req.params.staffId;
    const department = req.params.department;
    try {
        const subadmin = await Staff.findByPk(staffId);
        if (!subadmin) {
            const error = new Error('Subadmin not found');
            error.statusCode = 401;
            throw error;
        }
        const admin = await Staff.findOne({
            where: {
                department: { [Op.contains]: subadmin.department },
                role: 'admin'
            }
        });
        if (!admin) {
            const error = new Error('Department admin not found');
            error.statusCode = 401;
            throw error;
        }
        const complaints = await Complaint.findAll({
            where: {
                staffDepartment: department,
                staffId: { [Op.notIn]: [subadmin.id, admin.id] }
            }
        });
        res.status(200).json({ message: 'Fetched all complaints successfully.', complaints: complaints });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.searchOutgoingComplaints = async (req, res, next) => {
    const staffDepartment = req.params.staffDepartment;
    const query = req.params.query;
    try {
        const admin = await Staff.findOne({
            where: {
                department: { [Op.contains]: [staffDepartment] },
                role: 'subadmin'
            }
        });
        if (!admin) {
            const error = new Error('Department subadmin not found');
            error.statusCode = 401;
            throw error;
        }
        const complaint = await Complaint.findAll({
            where: {
                staffDepartment: staffDepartment,
                staffId: { [Op.notIn]: [subadmin.id, admin.id] },
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
        res.json(complaint);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.putApproval1 = async (req, res, next) => {
    const errors = validationResult(req);
    const subadminId = req.body.subadminId;
    const requestId = req.params.requestId;
    const approval = +req.body.approval;
    const approvalComment = req.body.approvalComment;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const subadmin = await Staff.findByPk(subadminId);
        if (!subadmin) {
            const error = new Error('Department subadmin not found');
            error.statusCode = 401;
            throw error;
        }
        const admin = await Staff.findOne({
            where: {
                department: { [Op.contains]: subadmin.department },
                role: 'admin'
            }
        });
        if (!admin) {
            const error = new Error('Department admin not found');
            error.statusCode = 401;
            throw error;
        }
        const subadminActivities = await SubadminActivities.findOne({
            where: {
                adminId: admin.id
            }
        });
        if (!subadminActivities) {
            const error = new Error('Subadmin activities not found');
            error.statusCode = 401;
            throw error;
        }
        const request = await Request.findByPk(requestId);
        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 401;
            throw error;
        }
        const report = await Report.findOne({
            where: {
                requestComplaintId: requestId
            }
        });
        if (!report) {
            const error = new Error('Report not found');
            error.statusCode = 401;
            throw error;
        }
        if (!approval) {
            const error = new Error('Either approve or disapprove the request');
            error.statusCode = 401;
            throw error;
        }
        if (approval === 1) {
            request.approval1 = 1;
            request.status = 'pending';
            request.approval1Comment = approvalComment;
            request.approval1Time = new Date();
            report.approval1Time = new Date();
            report.approval1Duration = new Date() - request.createdAt;
            subadminActivities.activities = subadminActivities.activities !== null ? subadminActivities.activities.concat([{ activity: `HOD approval has been done of request with an ID ${request.ticketId}`, dateTime: new Date() }]) : [{ activity: `HOD approval has been done of request with an ID ${request.ticketId}`, dateTime: new Date() }];
            await sendSubadminActivityMail(admin.email, 'Request approved', subadmin.firstname + ' ' + subadmin.lastname, `HOD approval has been done of request with an ID ${request.ticketId}`, getFormattedDate(new Date()));
        } else if (approval === 2) {
            request.approval1 = 2;
            request.status = 'disapproved';
            request.approval1Comment = approvalComment;
            request.approval1Time = new Date();
            report.destroy();
            subadminActivities.activities = subadminActivities.activities !== null ? subadminActivities.activities.concat([{ activity: `HOD disapproval has been done of request with an ID ${request.ticketId}`, dateTime: new Date() }]) : [{ activity: `HOD disapproval has been done of request with an ID ${request.ticketId}`, dateTime: new Date() }];
            await sendSubadminActivityMail(admin.email, 'Request disapproved', subadmin.firstname + ' ' + subadmin.lastname, `HOD disapproval has been done of request with an ID ${request.ticketId}`, getFormattedDate(new Date()));
        }
        const result = await request.save();
        await report.save();
        await subadminActivities.save();
        res.status(200).json({ message: 'Staff details updated', request: result });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.putApproval2 = async (req, res, next) => {
    const errors = validationResult(req);
    const requestId = req.params.requestId;
    const subadminId = req.body.subadminId;
    let staffId = null;
    const approval = +req.body.approval;
    const approvalComment = req.body.approvalComment;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const subadmin = await Staff.findByPk(subadminId);
        if (!subadmin) {
            const error = new Error('Department subadmin not found');
            error.statusCode = 401;
            throw error;
        }
        const admin = await Staff.findOne({
            where: {
                department: { [Op.contains]: subadmin.department },
                role: 'admin'
            }
        });
        if (!admin) {
            const error = new Error('Department admin not found');
            error.statusCode = 401;
            throw error;
        }
        const subadminActivities = await SubadminActivities.findOne({
            where: {
                adminId: admin.id
            }
        });
        if (!subadminActivities) {
            const error = new Error('Subadmin activities not found');
            error.statusCode = 401;
            throw error;
        }
        const request = await Request.findByPk(requestId);
        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 401;
            throw error;
        }
        const report = await Report.findOne({
            where: {
                requestComplaintId: requestId
            }
        });
        if (!report) {
            const error = new Error('Report not found');
            error.statusCode = 401;
            throw error;
        }
        if (!request.approval1 || request.approval1 === 2) {
            const error = new Error('No approval from department admin');
            error.statusCode = 401;
            throw error;
        }
        if (!approval) {
            const error = new Error('Either approve or disapprove the request');
            error.statusCode = 401;
            throw error;
        }
        if (approval === 1) {
            staffId = req.body.staffId;
            const staff = await Staff.findByPk(staffId);
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
                const error = new Error('Not assigned department staff');
                error.statusCode = 401;
                throw error;
            }
            request.approval2 = 1;
            request.assign = staffId;
            request.assignedName = staff.firstname + ' ' + staff.lastname;
            request.status = 'assigned';
            request.approval2Comment = approvalComment;
            request.approval2Time = new Date();
            const result = await request.save();
            report.assignedName = staff.firstname + ' ' + staff.lastname;
            report.approval2Time = result.approval2Time;
            report.assignedTime = result.approval2Time;
            report.assignDuration = result.approval2Time - result.createdAt;
            subadminActivities.activities = subadminActivities.activities !== null ? subadminActivities.activities.concat([{ activity: `Admin approval has been done of request with an ID ${request.ticketId}`, dateTime: new Date() }]) : [{ activity: `Admin approval has been done of request with an ID ${request.ticketId}`, dateTime: new Date() }];
            await sendSubadminActivityMail(admin.email, 'Request approved', subadmin.firstname + ' ' + subadmin.lastname, `Admin approval has been done of request with an ID ${request.ticketId}`, getFormattedDate(new Date()));
            await report.save();
            await subadminActivities.save();
            res.status(200).json({ message: 'Staff details updated', request: result });
            await sendMail(result.id, result.department, result.category, result.subject, result.description, next);
        } else if (approval === 2) {
            request.approval2 = 2;
            request.assign = null;
            request.status = 'disapproved';
            request.approval2Comment = approvalComment;
            request.approval2Time = new Date();
            const result = await request.save();
            await report.destroy();
            subadminActivities.activities = subadminActivities.activities !== null ? subadminActivities.activities.concat([{ activity: `Admin disapproval has been done of request with an ID ${request.ticketId}`, dateTime: new Date() }]) : [{ activity: `Admin disapproval has been done of request with an ID ${request.ticketId}`, dateTime: new Date() }];
            await sendSubadminActivityMail(admin.email, 'Request disapproved', subadmin.firstname + ' ' + subadmin.lastname, `Admin disapproval has been done of request with an ID ${request.ticketId}`, getFormattedDate(new Date()));
            await report.save();
            await subadminActivities.save();
            res.status(200).json({ message: 'Staff details updated', request: result });
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

const sendMail = async (requestId, department, category, subject, description, next) => {
    let email = '';
    let cc = [];
    try {
        const departmentAdmin = await Staff.findOne({
            where: {
                department: { [Op.contains]: [department] },
                role: 'admin'
            }
        });
        if (!departmentAdmin) {
            const error = new Error(`Department don't have any subadmin`);
            error.statusCode = 401;
            throw error;
        }
        email = departmentAdmin.email;
        const departmentTechnicians = await Staff.findAll({
            where: {
                department: { [Op.contains]: [department] },
                role: 'technician'
            }
        });
        for (let i = 0; i < departmentTechnicians.length; i++) {
            const technicianEmail = departmentTechnicians[i].email;
            cc = cc.concat(technicianEmail);
        }
        await transporter.sendMail({
            to: email,
            cc: cc,
            from: 'helpdeskinfo@met.edu',
            subject: `Requested ${category} #${requestId}`,
            html:
                `
                <body style="font-family: Arial, sans-serif; background-color: #f1f1f1; padding: 20px;">
                <div style="background-color: #ffffff; border-radius: 5px; padding: 20px; max-width: 600px; margin: 0 auto;">
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
                    <p>Thank you for your attention!</p>
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

const sendSubadminActivityMail = async (adminEmail, activitySubject, subadminName, activity, activityDateTime, next) => {
    try {
        await transporter.sendMail({
            to: adminEmail,
            from: 'helpdeskinfo@met.edu',
            subject: `${activitySubject}`,
            html:
                `
                <div style="background-color: #f4f4f4; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <div style="padding: 20px; text-align: center; background-color: #007bff; color: #ffffff; border-top-left-radius: 10px; border-top-right-radius: 10px;">
                        <h2>Sub-Admin Activity Notification</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Hello Admin,</p>
                        <p>A new activity has been performed by a sub-admin in the helpdesk system. Here are the details:</p>
                        
                        <ul>
                            <li><strong>Sub-Admin:</strong>${subadminName}</li>
                            <li><strong>Activity:</strong>${activity}</li>
                            <li><strong>Date and Time:</strong>${activityDateTime}</li>
                        </ul>
                        
                        <p>Please review this activity and take any necessary actions.</p>
                        
                        <p>Best regards,</p>
                        <p>Your Helpdesk Team</p>
                    </div>
                    <div style="text-align: center; padding: 20px; background-color: #f4f4f4; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
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

const getFormattedDate = (rawDate) => {
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