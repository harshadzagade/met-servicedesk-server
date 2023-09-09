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
const { getIO } = require('../../socket');

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
            const error = new Error('Employee not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role === 'subadmin') {
            const department = currentDepartment;
            const totalStaff = await Staff.findAll({ where: { department: [department], role: { [Op.notIn]: ['subadmin', 'admin'] } } });
            res.status(200).json({ message: 'Fetched all employees as per specific department successfully.', totalStaff: totalStaff });
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
                adminId: admin.id,
                department: subadmin.department
            }
        });
        if (!subadminActivities) {
            const error = new Error('Subadmin activities not found');
            error.statusCode = 401;
            throw error;
        }
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Employee not found');
            error.statusCode = 401;
            throw error;
        }
        subadminActivities.activities = subadminActivities.activities !== null ? subadminActivities.activities.concat([{ activity: `Role of staff ${staff.firstname + ' ' + staff.lastname} has been changed from ${staff.role} to ${role}`, data: { type: 'role', id: staffId }, dateTime: new Date() }]) : [{ activity: `Role of staff ${staff.firstname + ' ' + staff.lastname} has been changed from ${staff.role} to ${role}`, data: { type: 'role', id: staffId }, dateTime: new Date() }];
        await sendSubadminActivityMail(admin.email, 'Employee role changed', subadmin.firstname + ' ' + subadmin.lastname, `Role of staff ${staff.firstname + ' ' + staff.lastname} has been changed from ${staff.role} to ${role}`, getFormattedDate(new Date()));
        staff.role = role;
        if (staff.role === '' || staff.role === null) {
            staff.role = 'user';
            await staff.save();
        }
        const result = await staff.save();
        await subadminActivities.save();
        getIO().emit('subadminactivities');
        res.status(200).json({ message: 'Employee details updated', staff: result });
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
            const error = new Error('Employee not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role === 'subadmin') {
            const department = currentDepartment;
            const technicians = await Staff.findAll({ where: { department: [department], role: 'engineer' } });
            res.status(200).json({ message: 'Fetched all engineers as per specific department successfully.', technicians: technicians });
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

exports.assignComplaint = async (req, res, next) => {
    console.log('working');
    const complaintId = req.params.complaintId;
    const assignId = req.body.assignId;
    const subadminId = req.body.subadminId;
    try {
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
                adminId: admin.id,
                department: subadmin.department
            }
        });
        console.log(subadminActivities);
        if (!subadminActivities) {
            const error = new Error('Subadmin activities not found');
            error.statusCode = 401;
            throw error;
        }
        const complaint = await Complaint.findByPk(complaintId);
        if (!complaint) {
            const error = new Error('Concern not found');
            error.statusCode = 401;
            throw error;
        }
        const ticketRaiser = await Staff.findByPk(complaint.staffId);
        if (!ticketRaiser) {
            const error = new Error('Ticket raiser not found');
            error.statusCode = 401;
            throw error;
        }
        if (complaint.assign !== null) {
            const error = new Error(`Concern already assigned to ${complaint.assignedName}`);
            error.statusCode = 401;
            throw error;
        }
        const staff = await Staff.findByPk(assignId);
        if (!staff) {
            const error = new Error('Employee not found');
            error.statusCode = 401;
            throw error;
        }
        if ((complaint.status !== 'closed') && (complaint.status !== 'forwarded')) {
            complaint.assign = staff.id;
            complaint.assignedName = staff.firstname + '' + staff.lastname;
            complaint.status = 'attending';
            const result = await complaint.save();
            const reportCheck = await Report.findOne({
                where: {
                    requestComplaintId: complaint.id,
                    isComplaint: true,
                    assignId: assignId
                }
            });
            let report;
            if (reportCheck) {
                report = await Report.findByPk(reportCheck.id);
                report.isRequest = false;
                report.isComplaint = true;
                report.requestComplaintId = complaint.id;
                report.ticketId = complaint.ticketId;
                report.assignId = assignId;
                report.staffName = complaint.name;
                report.assignedName = staff.firstname + ' ' + staff.lastname;
                report.category = complaint.category;
                report.priority = complaint.priority;
                report.subject = complaint.subject;
                report.description = complaint.description;
                report.department = complaint.department;
                report.staffDepartment = complaint.staffDepartment;
                report.departmentType = ticketRaiser.departmentType;
                report.status = complaint.status;
                report.loggedTime = complaint.createdAt;
                report.attendedTime = new Date();
                report.attendDuration = new Date() - complaint.createdAt;
            } else {
                report = new Report({
                    isRequest: false,
                    isComplaint: true,
                    requestComplaintId: complaint.id,
                    ticketId: complaint.ticketId,
                    assignId: assignId,
                    staffName: complaint.name,
                    assignedName: staff.firstname + ' ' + staff.lastname,
                    category: complaint.category,
                    priority: complaint.priority,
                    subject: complaint.subject,
                    description: complaint.description,
                    department: complaint.department,
                    staffDepartment: complaint.staffDepartment,
                    departmentType: ticketRaiser.departmentType,
                    status: complaint.status,
                    loggedTime: complaint.createdAt,
                    attendedTime: new Date(),
                    attendDuration: new Date() - complaint.createdAt
                });
            }
            await report.save();
            subadminActivities.activities = subadminActivities.activities !== null ? subadminActivities.activities.concat([{ activity: `Assigned concern with ID ${complaint.ticketId} to ${staff.firstname + ' ' + staff.lastname}`, data: { type: 'concern', id: complaint.id }, dateTime: new Date() }]) : [{ activity: `Assigned concern with ID ${complaint.ticketId} to ${staff.firstname + ' ' + staff.lastname}`, data: { type: 'concern', id: complaint.id }, dateTime: new Date() }];
            await subadminActivities.save();
            await sendSubadminActivityMail(admin.email, 'Concern assigned to engineer', subadmin.firstname + ' ' + subadmin.lastname, `Assigned concern with ID ${complaint.ticketId} to ${staff.firstname + ' ' + staff.lastname}`, getFormattedDate(new Date()));
            await sendAssignMail(result.ticketId, assignId, result.department, result.category, result.subject, result.description, next);
            getIO().emit('complaintStatus');
            getIO().emit('subadminactivities');
            res.status(201).json({ message: 'Concern assigned successfully', complaint: result });
        } else {
            const error = new Error('Cannot assign to closed and forwarded requests');
            error.statusCode = 403;
            throw error;
        }
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
                adminId: admin.id,
                department: subadmin.department
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
        if (request.approval1) {
            const error = new Error('Cannot set approval multiple time');
            error.statusCode = 401;
            throw error;
        }
        const report = await Report.findOne({
            where: {
                requestComplaintId: requestId,
                isRequest: true
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
            report.approval1Comment = approvalComment;
            report.approval1Status = 'approved';
            subadminActivities.activities = subadminActivities.activities !== null ? subadminActivities.activities.concat([{ activity: `HOD approval has been done of request with an ID ${request.ticketId}`, data: { type: 'request', id: requestId }, dateTime: new Date() }]) : [{ activity: `HOD approval has been done of request with an ID ${request.ticketId}`, data: { type: 'request', id: requestId }, dateTime: new Date() }];
            await sendSubadminActivityMail(admin.email, 'Request approved', subadmin.firstname + ' ' + subadmin.lastname, `HOD approval has been done of request with an ID ${request.ticketId}`, getFormattedDate(new Date()));
        } else if (approval === 2) {
            request.approval1 = 2;
            request.status = 'disapproved';
            request.approval1Comment = approvalComment;
            request.approval1Time = new Date();
            report.approval1Time = new Date();
            report.approval1Duration = new Date() - request.createdAt;
            report.approval1Comment = approvalComment;
            report.approval1Status = 'disapproved';
            subadminActivities.activities = subadminActivities.activities !== null ? subadminActivities.activities.concat([{ activity: `HOD disapproval has been done of request with an ID ${request.ticketId}`, data: { type: 'request', id: requestId }, dateTime: new Date() }]) : [{ activity: `HOD disapproval has been done of request with an ID ${request.ticketId}`, data: { type: 'request', id: requestId }, dateTime: new Date() }];
            await sendSubadminActivityMail(admin.email, 'Request disapproved', subadmin.firstname + ' ' + subadmin.lastname, `HOD disapproval has been done of request with an ID ${request.ticketId}`, getFormattedDate(new Date()));
        }
        const result = await request.save();
        await report.save();
        await subadminActivities.save();
        getIO().emit('subadminactivities');
        getIO().emit('requestStatus');
        res.status(200).json({ message: 'Employee details updated', request: result });
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
                adminId: admin.id,
                department: subadmin.department
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
        if (request.approval2) {
            const error = new Error('Cannot set approval multiple time');
            error.statusCode = 401;
            throw error;
        }
        const report = await Report.findOne({
            where: {
                requestComplaintId: requestId,
                isRequest: true
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
                const error = new Error('Employee not found');
                error.statusCode = 401;
                throw error;
            }
            if (staff.role !== 'engineer') {
                const error = new Error('Employee is not a engineer');
                error.statusCode = 401;
                throw error;
            }
            if (staff.department[0] !== request.department) {
                const error = new Error('Not assigned department employee');
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
            report.assignId = staffId;
            report.assignedName = staff.firstname + ' ' + staff.lastname;
            report.approval2Time = result.approval2Time;
            report.assignedTime = result.approval2Time;
            report.assignDuration = result.approval2Time - result.createdAt;
            report.approval2Comment = approvalComment;
            report.approval2Status = 'approved';
            subadminActivities.activities = subadminActivities.activities !== null ? subadminActivities.activities.concat([{ activity: `Admin approval has been done of request with an ID ${request.ticketId}`, data: { type: 'request', id: requestId }, dateTime: new Date() }]) : [{ activity: `Admin approval has been done of request with an ID ${request.ticketId}`, data: { type: 'request', id: requestId }, dateTime: new Date() }];
            await sendSubadminActivityMail(admin.email, 'Request approved', subadmin.firstname + ' ' + subadmin.lastname, `Admin approval has been done of request with an ID ${request.ticketId}`, getFormattedDate(new Date()));
            await report.save();
            await subadminActivities.save();
            await sendMail(result.ticketId, staffId, result.department, result.category, result.subject, result.description, next);
            getIO().emit('subadminactivities');
            getIO().emit('requestStatus');
            res.status(200).json({ message: 'Employee details updated', request: result });
        } else if (approval === 2) {
            request.approval2 = 2;
            request.assign = null;
            request.status = 'disapproved';
            request.approval2Comment = approvalComment;
            request.approval2Time = new Date();
            const result = await request.save();
            report.approval2Time = result.approval2Time;
            report.assignedTime = result.approval2Time;
            report.assignDuration = result.approval2Time - result.createdAt;
            report.approval2Comment = approvalComment;
            report.approval2Status = 'disapproved';
            subadminActivities.activities = subadminActivities.activities !== null ? subadminActivities.activities.concat([{ activity: `Admin disapproval has been done of request with an ID ${request.ticketId}`, data: { type: 'request', id: requestId }, dateTime: new Date() }]) : [{ activity: `Admin disapproval has been done of request with an ID ${request.ticketId}`, data: { type: 'request', id: requestId }, dateTime: new Date() }];
            await sendSubadminActivityMail(admin.email, 'Request disapproved', subadmin.firstname + ' ' + subadmin.lastname, `Admin disapproval has been done of request with an ID ${request.ticketId}`, getFormattedDate(new Date()));
            await report.save();
            await subadminActivities.save();
            getIO().emit('subadminactivities');
            getIO().emit('requestStatus');
            res.status(200).json({ message: 'Employee details updated', request: result });
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

const sendMail = async (requestId, assignId, department, category, subject, description, next) => {
    let email = '';
    try {
        const departmentAdmin = await Staff.findOne({
            where: {
                department: { [Op.contains]: [department] },
                role: 'subadmin'
            }
        });
        if (!departmentAdmin) {
            const error = new Error(`Department don't have any subadmin`);
            error.statusCode = 401;
            throw error;
        }
        email = departmentAdmin.email;
        const assignedTechnician = await Staff.findByPk(assignId);
        if (!assignedTechnician) {
            const error = new Error(`Cannot find assigned engineer`);
            error.statusCode = 401;
            throw error;
        }
        await transporter.sendMail({
            to: assignedTechnician.email,
            cc: email,
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
                        <p>Dear Subadmin,</p>
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
                    <div style="padding: 20px; text-align: center; background-color: #DA251C; color: #ffffff; border-top-left-radius: 10px; border-top-right-radius: 10px;">
                        <h2>Sub-Admin Activity Notification</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Hello Admin,</p>
                        <p>A new activity has been performed by a sub-admin in the helpdesk system. Here are the details:</p>
                        
                        <ul>
                            <li><strong>Sub-Admin:</strong>&nbsp;${subadminName}</li>
                            <li><strong>Activity:</strong>&nbsp;${activity}</li>
                            <li><strong>Date and Time:</strong>&nbsp;${activityDateTime}</li>
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

const sendAssignMail = async (requestId, assignId, department, category, subject, description, next) => {
    let email = '';
    try {
        const departmentAdmin = await Staff.findOne({
            where: {
                department: { [Op.contains]: [department] },
                role: 'subadmin'
            }
        });
        if (!departmentAdmin) {
            const error = new Error(`Department don't have any admin`);
            error.statusCode = 401;
            throw error;
        }
        email = departmentAdmin.email;
        const assignedTechnician = await Staff.findByPk(assignId);
        if (!assignedTechnician) {
            const error = new Error(`Cannot find assigned engineer`);
            error.statusCode = 401;
            throw error;
        }
        await transporter.sendMail({
            to: assignedTechnician.email,
            cc: email,
            from: 'helpdeskinfo@met.edu',
            subject: `Assigned concern on ${category} ${requestId}`,
            html:
                `
                <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                        <div style="background-color: #DA251C; color: #ffffff; text-align: center; padding: 10px; border-top-left-radius: 5px; border-top-right-radius: 5px;">
                        <h1>MET Helpdesk</h1>
                        </div>
                        <div style="padding: 20px;">
                        <h2 style="color: #0088cc;">Helpdesk Ticket Notification</h2>
                        <p>Dear Engineer,</p>
                        <p>Admin have assigned a new ticket. Here are the details:</p>
                        <table style="width: 100%;">
                            <tr>
                                <td style="padding: 5px; font-weight: bold;">Ticket ID:</td>
                                <td style="padding: 5px;">${requestId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px; font-weight: bold;">Ticket Type:</td>
                                <td style="padding: 5px;">Concern</td>
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
                        <p>Please log in to the helpdesk system to check the assigned ticket.</p>
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
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};