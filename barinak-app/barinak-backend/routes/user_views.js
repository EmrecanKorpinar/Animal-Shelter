const express = require('express');
const router = express.Router();
const { addView, getViewedAnimals, getViewCount } = require('../controllers/userViewsController');
const { authenticate } = require('../middleware/auth');

router.post('/add', authenticate, addView);
router.get('/list', authenticate, getViewedAnimals);
router.get('/count', authenticate, getViewCount);

module.exports = router;
