const { Op } = require("sequelize");
const Request = require("../models/request");
const Complaint = require("../models/complaint");
const Staff = require("../models/staff");

exports.getDashboardData = async (req, res, next) => {
  const role = req.params.role;
  const department = req.params.department;
  const staffId = req.params.staffId;

  try {
    let data = {};

    if (role === 'superadmin') {
      // Fetch all data for Superadmin
      data.pendingRequests = await Request.findAll({ where: { status: 'pending' } });
      
      data.attendingRequests = await Request.findAll({ where: { status: 'attending' } });

      data.closedRequests = await Request.findAll({ where: { status: 'closed' } });

      data.pendingComplaints = await Complaint.findAll({ where: { status: 'pending' } });

      data.attendingComplaints = await Complaint.findAll({ where: { status: 'attending' } });

      data.closedComplaints = await Complaint.findAll({ where: { status: 'closed' } });

      data.allStaff = await Staff.findAll();

    } else if (role === 'admin' || role === 'subadmin') {
      // Fetch department-specific data for Admin or Subadmin
      data.pendingRequests = await Request.findAll({
        where: { status: 'pending', department: department }
      });
      data.attendingRequests = await Request.findAll({
        where: { status: 'attending', department: department }
      });
      data.closedRequests = await Request.findAll({
        where: { status: 'closed', department: department }
      });

      data.pendingComplaints = await Complaint.findAll({
        where: { status: 'pending', department: department }
      });
      data.attendingComplaints = await Complaint.findAll({
        where: { status: 'attending', department: department }
      });
      data.closedComplaints = await Complaint.findAll({
        where: { status: 'closed', department: department }
      });

    } else if (role === 'engineer') {
      // Fetch engineer-specific data
      // data.pendingRequests = await Request.findAll({
      //   where: { status: 'pending', id: staffId }
      // });
      // data.attendingRequests = await Request.findAll({
      //   where: { status: 'attending', id: staffId }
      // });
      // data.closedRequests = await Request.findAll({
      //   where: { status: 'closed', id: staffId }
      // });

      // data.pendingComplaints = await Complaint.findAll({
      //   where: { status: 'pending', id: staffId }
      // });
      // data.attendingComplaints = await Complaint.findAll({
      //   where: { status: 'attending', id: staffId }
      // });
      // data.closedComplaints = await Complaint.findAll({
      //   where: { status: 'closed', id: staffId }
      // });
      data.pendingRequests = await Request.findAll({
        where: { status: 'pending', department: department }
      });
      data.attendingRequests = await Request.findAll({
        where: { status: 'attending', department: department }
      });
      data.closedRequests = await Request.findAll({
        where: { status: 'closed', department: department }
      });

      data.pendingComplaints = await Complaint.findAll({
        where: { status: 'pending', department: department }
      });
      data.attendingComplaints = await Complaint.findAll({
        where: { status: 'attending', department: department }
      });
      data.closedComplaints = await Complaint.findAll({
        where: { status: 'closed', department: department }
      });
    }

    res.status(200).json({ message: `${role} Dashboard data fetched successfully`, data: data });

  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
