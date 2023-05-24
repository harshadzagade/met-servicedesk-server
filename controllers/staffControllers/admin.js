const Staff = require("../../models/staff");
const { getStaffDetailsCommon } = require("../../utils/functions");
const { getRequestsToDepartment, getRequestsFromDepartment } = require("../request");
const { getComplaintsFromDepartment, getComplaintsToDepartment } = require("../complaint");
const Op = require('sequelize').Op;
const Request = require("../../models/request");
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'siddharthbhat777@gmail.com',
        pass: 'itrflpdafyeavfzd'
    }
});

exports.getAdmin = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role !== 'admin') {
            const error = new Error('Unauthorised staff');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Staff verification successful!', staffId: staff.id })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

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
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getStaffDetails = async (req, res, next) => {
    const staffId = req.params.staffId;
    getStaffDetailsCommon(staffId, res, next);
};

exports.updateStaff = async (req, res, next) => {
    const staffId = req.params.staffId;
    const role = req.body.role;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        if (staff.role === 'superadmin' || staff.role === 'admin') {
            const error = new Error('Not allowed to edit role of admin or super-admin');
            error.statusCode = 401;
            throw error;
        }
        staff.role = role;
        if (staff.role === '' || staff.role === null) {
            staff.role = 'user';
            await staff.save();
        }
        const result = await staff.save();
        res.status(200).json({ message: 'Staff details updated', staff: result });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
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
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getOutgoingRequests = async (req, res, next) => {
    const department = req.params.department;
    try {
        const requests = await getRequestsFromDepartment(department, next);
        res.status(200).json({ message: 'Fetched all requests successfully.', requests: requests });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getIncomingRequests = async (req, res, next) => {
    const department = req.params.department;
    try {
        const requests = await getRequestsToDepartment(department, next);
        res.status(200).json({ message: 'Fetched all requests successfully.', requests: requests });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getOutgoingComplaints = async (req, res, next) => {
    const department = req.params.department;
    try {
        const complaints = await getComplaintsFromDepartment(department, next);
        res.status(200).json({ message: 'Fetched all complaints successfully.', complaints: complaints });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.putApproval1 = async (req, res, next) => {
    const requestId = req.params.requestId;
    const approval = req.body.approval;
    try {
        const request = await Request.findByPk(requestId);
        if (!request) {
            const error = new Error('Request not found');
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
        } else if (approval === 2) {
            request.approval1 = 2;
            request.status = 'disapproved';
        }
        const result = await request.save();
        res.status(200).json({ message: 'Staff details updated', request: result });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.putApproval2 = async (req, res, next) => {
    const requestId = req.params.requestId;
    let staffId = null;
    const approval = req.body.approval;
    const comment = req.body.comment;
    try {
        const request = await Request.findByPk(requestId);
        if (!request) {
            const error = new Error('Request not found');
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
            request.status = 'assigned';
            request.comment = comment;
            const result = await request.save();
            res.status(200).json({ message: 'Staff details updated', request: result });
            await sendMail(result.id, result.department, result.category, result.subject, result.description, next);
        } else if (approval === 2) {
            request.approval2 = 2;
            request.assign = null;
            request.status = 'disapproved';
            request.comment = comment;
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
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
            from: 'siddharthbhat777@gmail.com',
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
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};