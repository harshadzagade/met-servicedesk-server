const Complaint = require('../models/complaint');

exports.sendComplaint = async (req, res, next) => {
    const staffId = req.body.staffId;
    const behalf = req.body.behalf || false;
    let behalfId = null;
    const department = req.body.department;
    const category = req.body.category;
    const priority = req.body.priority;
    const subject = req.body.subject;
    const description = req.body.description;
    try {
        if (behalf) {
            behalfId = req.body.behalfId;
        }
        const complaint = new Complaint({
            staffId: staffId,
            status: 'pending',
            behalf: behalf,
            behalfId: behalfId,
            department: department,
            category: category,
            priority: priority,
            subject: subject,
            description: description
        });
        const result = await complaint.save();
        res.status(201).json({ message: 'Staff created!', complaint: result });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getAllComplaints = async (req, res, next) => {
    try {
        const complaints = await Complaint.findAll();
        res.status(200).json({ message: 'Fetched all requests successfully.', complaints: complaints });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};