const { importJobQueue } = require('../utils/importQueue');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Animal = require('../models/animalModel');
const { invalidateCache } = require('../utils/pubsub');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece CSV ve Excel dosyaları kabul edilir'), false);
    }
  }
});

// Yardımcı: farklı değerlerden boolean üret
function toBool(value) {
  if (typeof value === 'boolean') return value;
  if (value === 0 || value === 1) return Boolean(value);
  if (value == null) return false;
  const s = String(value).trim().toLowerCase();
  if (s === '') return false;
  return ['true', '1', 'evet', 'yes', 'y', 'e'].includes(s);
}

// CSV verilerini parse et
function parseCSVData(results) {
  return results.map(row => ({
    name: row.name || row.Name || row['Hayvan Adı'] || '',
    species: row.species || row.Species || row['Tür'] || '',
    age: parseInt(row.age || row.Age || row['Yaş'] || '0'),
    description: row.description || row.Description || row['Açıklama'] || '',
    imageurl: row.imageurl || row.imageUrl || row.image_url || row.ImageURL || row['Resim URL'] || '',
    adopted: toBool(row.adopted ?? row.Adopted ?? row['Sahiplendi'])
  }));
}

// Excel verilerini parse et
function parseExcelData(workbook) {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  return jsonData.map(row => ({
    name: row.name || row.Name || row['Hayvan Adı'] || '',
    species: row.species || row.Species || row['Tür'] || '',
    age: parseInt(row.age || row.Age || row['Yaş'] || '0'),
    description: row.description || row.Description || row['Açıklama'] || '',
    imageurl: row.imageurl || row.imageUrl || row.image_url || row.ImageURL || row['Resim URL'] || '',
    adopted: (row.adopted == 1 || row.Adopted == 1 || row['Sahiplendi'] == 1) ? false : toBool(row.adopted ?? row.Adopted ?? row['Sahiplendi'])
  }));
}

// CSV export
async function exportToCSV(req, res) {
  try {
    const animals = await Animal.getAll();

    const csvData = animals.map(animal => ({
      id: animal.id,
      name: animal.name,
      species: animal.species,
      age: animal.age,
      description: animal.description,
      imageurl: animal.imageurl,
      adopted: animal.adopted
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="hayvanlar.csv"');
    res.send(csvString);

  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: 'CSV export hatası: ' + err.message });
  }
}

// Excel export
async function exportToExcel(req, res) {
  try {
    const animals = await Animal.getAll();

    const excelData = animals.map(animal => ({
      'ID': animal.id,
      'Hayvan Adı': animal.name,
      'Tür': animal.species,
      'Yaş': animal.age,
      'Açıklama': animal.description,
      'Resim URL': animal.imageurl,
      'Sahiplendi': animal.adopted ? 'Evet' : 'Hayır'
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hayvanlar');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="hayvanlar.xlsx"');
    res.send(buffer);

  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).json({ error: 'Excel export hatası: ' + err.message });
  }
}

// Queue status endpoint
async function getQueueStatus(req, res) {
  try {
    const Queue = require('bull');
    const importQueue = new Queue('import-job', { redis: { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT || 6379 } });
    const imageQueue = new Queue('image-optimize', { redis: { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT || 6379 } });
    
    const [importCounts, imageCounts] = await Promise.all([
      importQueue.getJobCounts(),
      imageQueue.getJobCounts()
    ]);

    // Get some recent jobs for display
    const importJobs = await importQueue.getJobs(['completed', 'failed', 'active', 'waiting'], 0, 10);
    const imageJobs = await imageQueue.getJobs(['completed', 'failed', 'active', 'waiting'], 0, 10);

    await importQueue.close();
    await imageQueue.close();

    res.json({
      import: {
        counts: importCounts,
        recentJobs: importJobs.map(job => ({
          id: job.id,
          data: job.data,
          progress: job.progress(),
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
          opts: job.opts
        }))
      },
      imageOptimize: {
        counts: imageCounts,
        recentJobs: imageJobs.map(job => ({
          id: job.id,
          data: job.data,
          progress: job.progress(),
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
          opts: job.opts
        }))
      }
    });

  } catch (err) {
    console.error('Queue status error:', err);
    res.status(500).json({ error: err.message });
  }
}
async function importFromCSV(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV dosyası gereklidir' });
    }

    const results = [];
    const filePath = req.file.path;

    // CSV dosyasını oku
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const animals = parseCSVData(results);
          let enqueued = 0;
          for (const animal of animals) {
            await importJobQueue.add(animal);
            enqueued++;
          }
          fs.unlinkSync(filePath);
          res.json({
            success: true,
            message: `${enqueued} hayvan iş kuyruğuna eklendi. Arka planda işlenecek.`,
            enqueued
          });
        } catch (err) {
          console.error('CSV import error:', err);
          res.status(500).json({ error: 'CSV import hatası: ' + err.message });
        }
      });

  } catch (err) {
    console.error('CSV import error:', err);
    res.status(500).json({ error: 'CSV import hatası: ' + err.message });
  }
}

// Excel import
async function importFromExcel(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel dosyası gereklidir' });
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const animals = parseExcelData(workbook);

    let enqueued = 0;
    for (const animal of animals) {
      await importJobQueue.add(animal);
      enqueued++;
    }
    fs.unlinkSync(filePath);
    res.json({
      success: true,
      message: `${enqueued} hayvan iş kuyruğuna eklendi. Arka planda işlenecek.`,
      enqueued
    });

  } catch (err) {
    console.error('Excel import error:', err);
    res.status(500).json({ error: 'Excel import hatası: ' + err.message });
  }
}

// Excel şablon indir
// Queue status endpoint
async function getQueueStatus(req, res) {
  try {
    const { imageOptimizeQueue } = require('../utils/importQueue');
    
    // Import queue stats
    const importStats = await importJobQueue.getJobCounts();
    
    // Image optimize queue stats  
    const imageStats = await imageOptimizeQueue.getJobCounts();

    res.json({
      import: {
        counts: importStats,
        progress: importStats.completed > 0 ? 
          Math.round((importStats.completed / (importStats.completed + importStats.waiting + importStats.active)) * 100) : 0,
        totalJobs: importStats.completed + importStats.waiting + importStats.active,
        totalProcessed: importStats.completed
      },
      imageOptimize: {
        counts: imageStats,
        progress: imageStats.completed > 0 ? 
          Math.round((imageStats.completed / (imageStats.completed + imageStats.waiting + imageStats.active)) * 100) : 0,
        totalJobs: imageStats.completed + imageStats.waiting + imageStats.active,
        totalProcessed: imageStats.completed
      }
    });
  } catch (err) {
    console.error('Queue status error:', err);
    res.status(500).json({ error: 'Queue status alınamadı: ' + err.message });
  }
}

async function exportExcelTemplate(req, res) {
  try {
    const headers = [
      { 'Hayvan Adı': '', 'Tür': '', 'Yaş': '', 'Açıklama': '', 'Resim URL': '', 'Sahiplendi': '' }
    ];
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(headers, { skipHeader: false });
    // Başlıklara küçük bir not: değer örnekleri
    // İlk veri satırı örnek amaçlı boş bırakıldı
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sablon');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="hayvan_import_sablon.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error('Excel template export error:', err);
    res.status(500).json({ error: 'Excel şablon oluşturma hatası: ' + err.message });
  }
}

// Queue Status - İş kuyruğu durumunu getir
async function getQueueStatus(req, res) {
  try {
    const { importJobQueue, imageOptimizeQueue } = require('../utils/importQueue');
    
    // Import queue stats
    const importWaiting = await importJobQueue.getJobs(['waiting']);
    const importActive = await importJobQueue.getJobs(['active']);
    const importCompleted = await importJobQueue.getJobs(['completed'], 0, 99);
    const importFailed = await importJobQueue.getJobs(['failed'], 0, 99);
    
    // Image optimize queue stats
    const imageWaiting = await imageOptimizeQueue.getJobs(['waiting']);
    const imageActive = await imageOptimizeQueue.getJobs(['active']);
    const imageCompleted = await imageOptimizeQueue.getJobs(['completed'], 0, 99);
    const imageFailed = await imageOptimizeQueue.getJobs(['failed'], 0, 99);

    // Calculate progress
    const totalImportJobs = importWaiting.length + importActive.length + importCompleted.length;
    const importProgress = totalImportJobs > 0 ? Math.round((importCompleted.length / totalImportJobs) * 100) : 0;
    
    const totalImageJobs = imageWaiting.length + imageActive.length + imageCompleted.length;
    const imageProgress = totalImageJobs > 0 ? Math.round((imageCompleted.length / totalImageJobs) * 100) : 0;

    const response = {
      import: {
        counts: {
          waiting: importWaiting.length,
          active: importActive.length,
          completed: importCompleted.length,
          failed: importFailed.length
        },
        progress: importProgress,
        totalJobs: totalImportJobs,
        totalProcessed: importCompleted.length
      },
      imageOptimize: {
        counts: {
          waiting: imageWaiting.length,
          active: imageActive.length,
          completed: imageCompleted.length,
          failed: imageFailed.length
        },
        progress: imageProgress,
        totalJobs: totalImageJobs,
        totalProcessed: imageCompleted.length
      }
    };

    console.log('Queue stats response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (err) {
    console.error('Queue status error:', err);
    res.status(500).json({ error: 'Queue durumu alınamadı: ' + err.message });
  }
}

module.exports = {
  upload,
  exportToCSV,
  exportToExcel,
  importFromCSV,
  importFromExcel,
  exportExcelTemplate,
  getQueueStatus
};
