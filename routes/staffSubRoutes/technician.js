const express = require('express');

const router = express.Router();

const technicianController = require('../../controllers/staffControllers/technician');

router.get('/:staffId', technicianController.getTechnician);

router.get('/getassignedrequests/:staffId', technicianController.getAssignedRequests);

router.put('/changerequeststatus/:requestId', technicianController.changeRequestStatus);

router.put('/selfassigncomplaint/:complaintId', technicianController.selfAssignComplaint);

router.put('/changecomplaintstatus/:complaintId', technicianController.changeComplaintStatus);

module.exports = router;