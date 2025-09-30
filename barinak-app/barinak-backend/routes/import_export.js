const express = require('express');
const router = express.Router();
const { upload, exportToCSV, exportToExcel, importFromCSV, importFromExcel, exportExcelTemplate } = require('../controllers/importExportController');
const { authenticate } = require('../middleware/auth');

// Tüm import/export routes'ları admin gerektirir
router.use(authenticate);
router.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu işlem için admin yetkisi gereklidir' });
  }
  next();
});

// CSV Export
router.get('/export/csv', exportToCSV);

// Excel Export
router.get('/export/excel', exportToExcel);

// CSV Import
router.post('/import/csv', upload.single('file'), importFromCSV);

// Excel Import
router.post('/import/excel', upload.single('file'), importFromExcel);

// Excel Template Download
router.get('/template/excel', exportExcelTemplate);

module.exports = router;
