const Request = require('../models/request');
const Staff = require('../models/staff');
const Op = require('sequelize').Op;
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'siddharthbhat777@gmail.com',
        pass: 'itrflpdafyeavfzd'
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
    const category = req.body.category;
    const priority = req.body.priority;
    const subject = req.body.subject;
    const description = req.body.description;
    let hodEmail;
    let adminEmail;
    let files = [];
    const isRepeated = req.body.isRepeated || false;
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
                const error = new Error('Staff not found');
                error.statusCode = 401;
                throw error;
            }
            behalfId = staff.id;
            requestStaffId = behalfId;
        }
        const staff = await Staff.findByPk(requestStaffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        const request = new Request({
            staffId: staffId,
            behalf: behalf,
            behalfId: behalfId,
            name: staff.lastname === '' ? staff.firstname : staff.firstname + ' ' + staff.lastname,
            status: 'pending',
            assign: null,
            department: department,
            category: category,
            priority: priority,
            subject: subject,
            description: description,
            attachment: files,
            isRepeated: isRepeated
        });
        const result = await request.save();
        const requester = await Staff.findByPk(requestStaffId);
        if (!requester) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
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
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        adminEmail = admin.email;
        await sendMail(hodEmail, adminEmail, category, result.id, subject, description, next);
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

exports.getRequestDepartments = async (req, res, next) => {
    const allRequests = await Request.findAll();
    let allDept = [];
    allRequests.map((request) => {
        const department = request.department;
        allDept.push(department);
    });
    const allDepartments = allDept;
    const uniqueDepartments = allDepartments.filter(function (item, position) {
        return allDepartments.indexOf(item) == position;
    })
    const departments = uniqueDepartments;
    res.status(200).json({ message: 'Fetched departments!', departments: departments });
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

exports.getRequestCategories = async (req, res, next) => {
    const allRequests = await Request.findAll();
    let allCategory = [];
    allRequests.map((request) => {
        const category = request.category;
        allCategory.push(category);
    });
    const allCategories = allCategory;
    const uniqueCategories = allCategories.filter(function (item, position) {
        return allCategories.indexOf(item) == position;
    })
    const categories = uniqueCategories;
    res.status(200).json({ message: 'Fetched categories', categories: categories });
};

exports.getRequestByCategory = async (req, res, next) => {
    const category = req.params.category;
    try {
        const requests = await Request.findAll({
            where: {
                category: category
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

exports.getRequestByPriority = async (req, res, next) => {
    const priority = req.params.priority;
    try {
        const requests = await Request.findAll({
            where: {
                priority: priority
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

exports.getRequestByStatus = async (req, res, next) => {
    const status = req.params.status;
    try {
        const requests = await Request.findAll({
            where: {
                status: status
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

exports.getRequestByHodApproval = async (req, res, next) => {
    let approval = req.params.approval;
    if (approval === '0') {
        approval = null;
    }
    try {
        const requests = await Request.findAll({
            where: {
                approval1: approval
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

exports.getRequestByAdminApproval = async (req, res, next) => {
    let approval = req.params.approval;
    if (approval === '0') {
        approval = null;
    }
    try {
        const requests = await Request.findAll({
            where: {
                approval2: approval
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

const sendMail = async (hodEmail, adminEmail, category, requestId, subject, description, next) => {
    try {
        if (hodEmail === adminEmail) {
            await transporter.sendMail({
                to: hodEmail,
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
        } else {
            transporter.sendMail({
                to: [hodEmail, adminEmail],
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
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};