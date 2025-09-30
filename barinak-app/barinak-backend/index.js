require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { getCacheStats, clearCacheStats, warmCache } = require('./middleware/cache');
const requestLogger = require('./middleware/requestLogger');
const pool = require('./db/pool');
const { setupSubscribers } = require('./utils/pubsub');
const { ensureBucketExists } = require('./utils/s3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT || 3001;

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite dev server
    methods: ["GET", "POST"]
  }
});

// Store connected users
const connectedUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const payload = jwt.verify(token, 'devsecret');
      socket.userId = payload.id;
      socket.userRole = payload.role;
      connectedUsers.set(payload.id, socket.id);
      console.log(`User ${payload.id} authenticated via WebSocket`);
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      socket.disconnect();
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
    }
  });
});

// Make io accessible to other modules
app.set('io', io);

app.use(cors());
app.use(express.json());
// Log every request to the database (non-blocking)
app.use(requestLogger);

// Health check (no DB dependency)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// DB health (checks DB connectivity and simple query)
app.get('/api/db/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message, code: e?.code });
  }
});

// Routers
const animalsRouter = require('./routes/animals');
app.use('/api/animals', animalsRouter);
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);
const adoptionRouter = require('./routes/adoption_requests');
app.use('/api/adoption_requests', adoptionRouter);
const notificationsRouter = require('./routes/notifications');
app.use('/api/notifications', notificationsRouter);
const importExportRouter = require('./routes/import_export');
app.use('/api/import-export', importExportRouter);
const userViewsRouter = require('./routes/user_views');
app.use('/api/user_views', userViewsRouter);
const searchRouter = require('./routes/search');
app.use('/api/search', searchRouter);

app.get('/api/cache/stats', (req, res) => {
  res.json(getCacheStats());
});

app.post('/api/cache/clear', (req, res) => {
  clearCacheStats();
  res.json({ message: 'Cache statistics cleared' });
});

app.post('/api/cache/warm', async (req, res) => {
  try {
    await warmCache();
    res.json({ message: 'Cache warmed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Cache warming failed: ' + err.message });
  }
});

async function ensureSchema() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'db', 'setup.sql'), 'utf8');
    await pool.query(sql);
    console.log('DB schema ensured');
  } catch (e) {
    console.error('DB schema ensure failed:', e?.message || e);
    // Dev'de devam edebiliriz; ancak login gibi akışlar şema yoksa 500 dönebilir.
  }
}

async function bootstrapAdmin() {
  try {
    const exists = await pool.query('SELECT 1 FROM users WHERE username = $1', ['admin']);
    if (!exists.rowCount) {
      const pass = await bcrypt.hash('adminpass', 10);
      await pool.query('INSERT INTO users (username, password, role) VALUES ($1,$2,$3)', ['admin', pass, 'admin']);
      console.log('Default admin user created: admin / adminpass');
    }
  } catch (e) {
    console.error('Admin bootstrap failed:', e?.message || e);
  }
}

(async () => {
  await ensureSchema();
  await bootstrapAdmin();

  // Ensure S3 bucket exists (MinIO)
  try {
    await ensureBucketExists();
  } catch (e) {
    console.error('Bucket ensure failed (continuing):', e.message || e);
  }

  // Redis subscriber'ları başlat
  setupSubscribers();

  server.listen(port, () => {
    console.log(`Barinak backend dinleniyor: http://localhost:${port}`);
  });
})();
