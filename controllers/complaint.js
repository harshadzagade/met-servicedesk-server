const Complaint = require('../models/complaint');
const Staff = require('../models/staff');
const Op = require('sequelize').Op;
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'helpdeskinfo@met.edu',
        pass: 'lzhqhnnscnxiwwqc'
    }
});

exports.sendComplaint = async (req, res, next) => {
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
        const complaint = new Complaint({
            staffId: staffId,
            behalf: behalf,
            behalfId: behalfId,
            name: staff.lastname === '' ? staff.firstname : staff.firstname + ' ' + staff.lastname,
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
        const complaintRes = await complaint.save();
        const setId = await Complaint.findByPk(complaintRes.id);
        const currentDate = new Date();
        setId.ticketId = '#' + currentDate.getFullYear() + setId.id;
        const result = await setId.save();
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
        await sendMail(admin.email, category, result.id, subject, description, next);
        res.status(201).json({ message: 'Staff created!', complaint: result });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getAllComplaints = async (req, res, next) => {
    try {
        const complaints = await Complaint.findAll();
        res.status(200).json({ message: 'Fetched all requests successfully.', complaints: complaints });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.searchAllComplaints = async (req, res, next) => {
    const query = req.params.query;
    try {
        const complaint = await Complaint.findAll({
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
        res.json(complaint);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getComplaintsFromDepartment = async (id, department, next) => {
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
        let allComplaints = [];
        for (let i = 0; i < staffs.length; i++) {
            const singleStaff = staffs[i];
            const complaints = await Complaint.findAll({
                where: {
                    staffId: singleStaff.id
                }
            });
            allComplaints = allComplaints.concat(complaints);
        }
        return allComplaints;
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.ownComplaints = async (req, res, next) => {
    const staffId = req.params.staffId;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        const complaints = await Complaint.findAll({
            where: {
                [Op.or]: [
                    { staffId: staffId },
                    { category: 'general' }
                ]
            }
        });
        res.status(200).json({ message: 'Staff created!', complaints: complaints });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.searchOwnComplaints = async (req, res, next) => {
    const staffId = req.params.staffId;
    const query = req.params.query;
    try {
        const staff = await Staff.findByPk(staffId);
        if (!staff) {
            const error = new Error('Staff not found');
            error.statusCode = 401;
            throw error;
        }
        const complaint = await Complaint.findAll({
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
        res.json(complaint);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getIncomingComplaints = async (req, res, next) => {
    const department = req.params.department;
    try {
        const complaints = await Complaint.findAll({
            where: {
                department: department
            }
        });
        if (!complaints) {
            const error = new Error('Complaints not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Fetched all requests successfully.', complaints: complaints });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.searchIncomingComplaints= async (req, res, next) => {
    const department = req.params.department;
    const query = req.params.query;
    try {
        const complaint = await Complaint.findAll({
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
        res.json(complaint);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getComplaintDetails = async (req, res, next) => {
    const complaintId = req.params.complaintId;
    try {
        const complaint = await Complaint.findByPk(complaintId);
        if (!complaint) {
            const error = new Error('Complaint not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Complaint fetched successfully!', complaint: complaint });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.downloadFiles = async (req, res, next) => {
    const complaintId = req.params.complaintId;
    try {
        const complaint = await Complaint.findByPk(complaintId);
        if (!complaint) {
            const error = new Error('Complaint not found');
            error.statusCode = 401;
            throw error;
        }
        const zipStream = archiver('zip', {
            zlib: { level: 9 }
        });
        zipStream.pipe(res);
        complaint.attachment.forEach((filePath) => {
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

const sendMail = async (adminEmail, category, requestId, subject, description, next) => {
    try {
        await transporter.sendMail({
            to: adminEmail,
            from: 'helpdeskinfo@met.edu',
            subject: `Complaint regarding ${category} #${requestId}`,
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