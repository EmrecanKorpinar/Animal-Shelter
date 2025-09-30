const express = require('express');
const router = express.Router();
const { searchAnimals } = require('../controllers/searchController');

// Public search endpoint
router.get('/', searchAnimals);

module.exports = router;

