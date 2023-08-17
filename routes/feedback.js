const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const feedbackController = require('../controllers/feedback');

router.post('/', feedbackController.postFeedback);

module.exports = router;