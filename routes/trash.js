const express = require('express');

const router = express.Router();

const trashController = require('../controllers/trash');

router.get('/', trashController.getAllStaff);

router.get('/staffdetails/:staffId', trashController.getStaffDetails);

router.delete('/staffdetails/restore/:staffId', trashController.restoreStaff);

router.delete('/restoreall', trashController.restoreAllStaff);

router.delete('/staffdetails/remove/:staffId', trashController.removeStaff);

router.delete('/removeall', trashController.removeAllStaff);

module.exports = router;