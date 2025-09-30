// Basit app config
require('dotenv').config();

const Redis = require('ioredis');
const AWS = require('aws-sdk');

const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'devsecret',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'barinak',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'animal-photos',
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  }
};

// Türkiye saat dilimini ayarla
process.env.TZ = 'Europe/Istanbul';

// PostgreSQL connection string
const pgConnectionString = `postgresql://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.database}?sslmode=disable`;

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

// Configure AWS S3 client for MinIO compatibility
const s3 = new AWS.S3({
  endpoint: config.s3.endpoint,
  accessKeyId: config.s3.accessKeyId,
  secretAccessKey: config.s3.secretAccessKey,
  s3ForcePathStyle: config.s3.s3ForcePathStyle,
  signatureVersion: config.s3.signatureVersion,
});

module.exports = {
  // Projede JWT için .env gerekmesin istendiği için sabit bir development secret kullanıyoruz
  // İleride prod’da değiştirmek isterseniz burada veya ortam değişkeni ile güncelleyebilirsiniz.
  JWT_SECRET: 'devsecret',
  redisClient,
  s3,
  s3Config: config.s3,
};
