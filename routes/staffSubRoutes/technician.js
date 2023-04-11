const express = require('express');

const router = express.Router();

const technicianController = require('../../controllers/staffControllers/technician');

router.get('/:staffId', technicianController.getTechnician);

module.exports = router;