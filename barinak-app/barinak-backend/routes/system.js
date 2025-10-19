const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// System monitoring endpoint (admin only)
router.get('/stats', authenticate, requireAdmin, systemController.getSystemStats);

module.exports = router;