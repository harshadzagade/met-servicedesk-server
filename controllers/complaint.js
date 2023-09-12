const Complaint = require('../models/complaint');
const Staff = require('../models/staff');
const Op = require('sequelize').Op;
const nodemailer = require('nodemailer');
const { getIO } = require('../socket');

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
                const error = new Error('Employee not found');
                error.statusCode = 401;
                throw error;
            }
            behalfId = staff.id;
            if (behalfId.toString() === staffId) {
                const error = new Error('Cannot use your own email ID as behalf email ID');
                error.statusCode = 401;
                throw error;
            }
            requestStaffId = behalfId;
        }
        const staff = await Staff.findByPk(requestStaffId);
        if (!staff) {
            const error = new Error('Employee not found');
            error.statusCode = 401;
            throw error;
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
        setId.ticketId = '#C' + currentDate.getFullYear() + (String(currentDate.getMonth() + 1).padStart(2, '0')) + setId.id;
        const result = await setId.save();
        await sendMail(admin.email, result.department, category, result.ticketId, subject, description, next);
        getIO().emit('complaints');
        res.status(201).json({ message: 'Concern created!', complaint: result });
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
        res.status(200).json({ message: 'Fetched all concerns successfully.', complaints: complaints });
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
            const error = new Error('Employee not found');
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
        res.status(200).json({ message: 'Concern created!', complaints: complaints });
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
            const error = new Error('Employee not found');
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
            const error = new Error('Concerns not found');
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

exports.searchIncomingComplaints = async (req, res, next) => {
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
            const error = new Error('Concern not found');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Concern fetched successfully!', complaint: complaint });
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
            const error = new Error('Concern not found');
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

const sendMail = async (adminEmail, department, category, complaintId, subject, description, next) => {
    let cc = [];
    const departmentTechnicians = await Staff.findAll({
        where: {
            department: { [Op.contains]: [department] },
            role: 'engineer'
        }
    });
    for (let i = 0; i < departmentTechnicians.length; i++) {
        const technicianEmail = departmentTechnicians[i].email;
        cc = cc.concat(technicianEmail);
    }
    try {
        await transporter.sendMail({
            to: adminEmail,
            cc: cc,
            from: 'helpdeskinfo@met.edu',
            subject: `Concern regarding ${category} ${complaintId}`,
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
                                <td style="padding: 5px;">${complaintId}</td>
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