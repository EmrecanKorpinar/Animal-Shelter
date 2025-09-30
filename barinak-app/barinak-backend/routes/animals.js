const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/animalController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');
const multer = require('multer');

// Multer in-memory storage for direct S3 upload
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Cache key generator
const animalListCacheKey = (req) => 'animals:list';
const animalDetailCacheKey = (req) => `animal:${req.params.id}`;

// Hayvan listesi için cache uygula (5 dakika)
router.get('/', cacheMiddleware(animalListCacheKey, 300), ctrl.list);
router.get('/adopted', cacheMiddleware('animals:adopted', 300), ctrl.listAdoptedWithUser);
router.get('/:id', cacheMiddleware(animalDetailCacheKey, 300), ctrl.getById);
router.post('/', authenticate, requireAdmin, upload.single('image'), ctrl.create);
router.put('/:id', authenticate, requireAdmin, upload.single('image'), ctrl.update);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;
