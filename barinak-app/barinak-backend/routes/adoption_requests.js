const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adoptionController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/', authenticate, ctrl.create); // authenticated user creates request
router.get('/', authenticate, requireAdmin, ctrl.list); // admin lists requests
router.put('/:id/process', authenticate, requireAdmin, ctrl.process); // admin approves/rejects
// user-specific
router.get('/mine', authenticate, ctrl.listMine);
router.delete('/mine/:id', authenticate, ctrl.cancelMine);
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  // simple delete: mark rejected and remove
  const id = Number(req.params.id);
  try {
    const ar = await require('../models/adoptionModel').getById(id);
    if (!ar) return res.status(404).json({ error: 'not found' });
    await require('../models/adoptionModel').updateStatus(id, 'rejected');
    res.json({ deleted: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
