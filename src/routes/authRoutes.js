const express = require('express');
const { register } = require('../controllers/authController');

const router = express.Router();

router.post('/register-landlord', register);

module.exports = router;