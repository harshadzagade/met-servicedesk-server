const Staff = require("../../models/staff");
const { getStaffDetailsCommon } = require("../../utils/functions");
const { getRequestsToDepartment, getRequestsFromDepartment } = require("../request");
const { getComplaintsFromDepartment } = require("../complaint");
const Op = require('sequelize').Op;
const Request = require("../../models/request");
const nodemailer = require('nodemailer');
const Report = require("../../models/report");
const { validationResult } = require("express-validator");
const { Sequelize } = require("sequelize");
const Complaint = require("../../models/complaint");
const SubadminActivities = require('../../models/subadminactivities');

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
        if (staff.role === 'admin') {
            const department = currentDepartment;
            const totalStaff = await Staff.findAll({ where: { department: [department], id: { [Op.ne]: staff.id } } });
            res.status(200).json({ message: 'Fetched all staff as per specific department successfully.', totalStaff: totalStaff });
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

exports.searchDepartmentStaff = async (req, res, next) => {
    const query = req.params.query;
    const currentDepartment = req.params.currentDepartment;
    try {
        const staff = await Staff.findAll({
            where: {
                department: { [Op.contains]: [currentDepartment] },
                role: { [Op.ne]: 'admin' },
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
    const role = req.body.role;
    try {
        if (!errors.isEmpty()) {
            const error = new Error(errors.errors[0].msg);
            error.statusCode = 422;
            throw error;
        }
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        staff.role = role;
        if (role === 'subadmin') {
            const admin = await Staff.findOne({
                where: {
                    department: { [Op.contains]: staff.department },
                    role: 'admin'
                }
            });
            const subadminActivities = new SubadminActivities({
                adminId: admin.id,
                department: staff.department[0]
            });
            await subadminActivities.save();
        }
        if (staff.role === '' || staff.role === null) {
            staff.role = 'user';
            await staff.save();
        }
        const result = await staff.save();
        res.status(200).json({ message: 'Staff details updated', staff: result });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getAdminDepartments = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Departments fetched successfully', departments: staff.department });
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
        if (staff.role === 'admin') {
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
        const requests = await getRequestsFromDepartment(staffId, department, next);
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
        const admin = await Staff.findOne({
            where: {
                department: { [Op.contains]: [staffDepartment] },
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
                staffId: { [Op.ne]: admin.id },
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
        const complaints = await getComplaintsFromDepartment(staffId, department, next);
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
                role: 'admin'
            }
        });
        if (!admin) {
            const error = new Error('Department admin not found');
            error.statusCode = 401;
            throw error;
        }
        const complaint = await Complaint.findAll({
            where: {
                staffDepartment: staffDepartment,
                staffId: { [Op.ne]: admin.id },
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
    const requestId = req.params.requestId;
    const approval = +req.body.approval;
    const approvalComment = req.body.approvalComment;
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
        } else if (approval === 2) {
            request.approval1 = 2;
            request.status = 'disapproved';
            request.approval1Comment = approvalComment;
            request.approval1Time = new Date();
            report.destroy();
        }
        const result = await request.save();
        await report.save();
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
    let staffId = null;
    const approval = +req.body.approval;
    const approvalComment = req.body.approvalComment;
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
            await report.save();
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
            await report.save();
            res.status(200).json({ message: 'Staff details updated', request: result });
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getsubadminActivities = async (req, res, next) => {
    const adminId = req.params.adminId;
    try {
        const subadminActivities = await SubadminActivities.findOne({
            where: { adminId: adminId }
        });
        if (!subadminActivities) {
            const error = new Error('Subadmin activities not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Subadmin activities fetched successfully', activities: subadminActivities });
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
            const error = new Error(`Department don't have any admin`);
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
            <div class="container" style="max-width: 90%; margin: auto; padding-top: 20px">
                <h2>MET Service Desk</h2>
                <h4>Request received ✔</h4>
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