const express = require('express');

const router = express.Router();

const userController = require('../../controllers/staffControllers/user');

router.get('/:staffId', userController.getUser);

module.exports = router;