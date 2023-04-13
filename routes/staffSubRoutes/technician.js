const express = require('express');

const router = express.Router();

const technicianController = require('../../controllers/staffControllers/technician');

router.get('/:staffId', technicianController.getTechnician);

router.get('/getassignedrequests/:staffId', technicianController.getAssignedRequests);

module.exports = router;