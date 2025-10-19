const pool = require('../db/pool');
const { redisClient } = require('../config');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

// Active users tracking (in-memory for demo, could use Redis)
const activeUsers = new Map(); // userId -> { lastSeen, username, role }

// Update user activity
function updateUserActivity(userId, username, role) {
  activeUsers.set(userId, {
    lastSeen: new Date(),
    username,
    role
  });
}

// Get active users (last 5 minutes)
function getActiveUsers() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const active = [];
  
  for (const [userId, userData] of activeUsers) {
    if (userData.lastSeen > fiveMinutesAgo) {
      active.push({
        userId,
        username: userData.username,
        role: userData.role,
        lastSeen: userData.lastSeen
      });
    } else {
      // Remove old entries
      activeUsers.delete(userId);
    }
  }
  
  return active;
}

// System monitoring endpoint
async function getSystemStats(req, res) {
  try {
    // System resources
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
    
    const cpuUsage = os.loadavg()[0]; // 1-minute load average
    const uptime = os.uptime();
    
    // Database stats
    let dbStats = {};
    try {
      const dbResult = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM animals) as total_animals,
          (SELECT COUNT(*) FROM animals WHERE adopted = true) as adopted_animals,
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM adoption_requests) as total_requests,
          (SELECT COUNT(*) FROM adoption_requests WHERE status = 'pending') as pending_requests
      `);
      dbStats = dbResult.rows[0];
    } catch (err) {
      dbStats = { error: err.message };
    }

    // Redis stats
    let redisStats = {};
    try {
      const redisInfo = await redisClient.info('memory');
      const lines = redisInfo.split('\n');
      const memInfo = {};
      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          memInfo[key.trim()] = value.trim();
        }
      });
      
      redisStats = {
        connected: redisClient.status === 'ready',
        memory: memInfo['used_memory_human'] || 'N/A',
        keys: await redisClient.dbsize()
      };
    } catch (err) {
      redisStats = { connected: false, error: err.message };
    }

    // Disk usage (uploads folder)
    let diskStats = {};
    try {
      const uploadsPath = path.join(__dirname, '../uploads');
      const files = await fs.readdir(uploadsPath).catch(() => []);
      let totalSize = 0;
      
      for (const file of files) {
        try {
          const stats = await fs.stat(path.join(uploadsPath, file));
          totalSize += stats.size;
        } catch (e) {
          // Skip files that can't be read
        }
      }
      
      diskStats = {
        uploadFiles: files.length,
        uploadSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
      };
    } catch (err) {
      diskStats = { error: err.message };
    }

    // Active users
    const activeUsersData = getActiveUsers();

    // Response times (could be enhanced with real metrics)
    const responseStats = {
      avgResponseTime: Math.random() * 100 + 50, // Mock data for demo
      requestCount: Math.floor(Math.random() * 1000) + 500,
      errorRate: (Math.random() * 5).toFixed(2) + '%'
    };

    res.json({
      system: {
        memory: {
          total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
          used: `${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
          free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
          usagePercent: memUsagePercent
        },
        cpu: {
          loadAverage: cpuUsage.toFixed(2),
          cores: os.cpus().length
        },
        uptime: {
          seconds: uptime,
          formatted: formatUptime(uptime)
        }
      },
      database: dbStats,
      redis: redisStats,
      disk: diskStats,
      activeUsers: activeUsersData,
      response: responseStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

module.exports = {
  getSystemStats,
  updateUserActivity,
  getActiveUsers
};