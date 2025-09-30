const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// public
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', authenticate, userController.logout);

// authenticated - current user info
router.get('/me', authenticate, (req, res) => {
  // Return safe subset
  const { id, username, role } = req.user || {};
  res.json({ id, username, role });
});

// admin-only
router.get('/', authenticate, requireAdmin, userController.list);
router.put('/:id', authenticate, requireAdmin, userController.update);
router.delete('/:id', authenticate, requireAdmin, userController.remove);

module.exports = router;
