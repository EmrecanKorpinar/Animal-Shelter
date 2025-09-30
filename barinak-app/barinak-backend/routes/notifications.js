const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getMine);
router.get('/unread-count', authenticate, ctrl.getUnreadCount);
router.put('/:id/read', authenticate, ctrl.markAsRead);
router.put('/read-all', authenticate, ctrl.markAllAsRead);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;
