const express = require('express');

const router = express.Router();

const technicianController = require('../../controllers/staffControllers/technician');

router.get('/:staffId', technicianController.getTechnician);

// router.get('/requests/outgoing/:staffId', technicianController.getOutgoingRequests);

// router.get('/complaints/outgoing/:staffId', technicianController.getOutgoingComplaints);

module.exports = router;