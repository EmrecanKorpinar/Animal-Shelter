/* eslint-env node */
const { s3, s3Config } = require('../config');
const path = require('path');

async function ensureBucketExists() {
  try {
    const buckets = await s3.listBuckets().promise();
    const exists = buckets.Buckets.some(b => b.Name === s3Config.bucket);
    if (!exists) {
      await s3.createBucket({ Bucket: s3Config.bucket }).promise();
      console.log(`Created S3 bucket: ${s3Config.bucket}`);
    } else {
      console.log(`S3 bucket exists: ${s3Config.bucket}`);
    }

    // Set public read policy so uploaded objects are accessible via HTTP
    try {
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicReadGetObject',
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${s3Config.bucket}/*`]
          }
        ]
      };
      await s3.putBucketPolicy({ Bucket: s3Config.bucket, Policy: JSON.stringify(policy) }).promise();
      console.log('Set public read policy for bucket');
    } catch (e) {
      // Some S3 implementations may not allow putBucketPolicy; ignore non-fatal
      console.warn('Could not set bucket policy (non-fatal):', e.message || e);
    }

  } catch (err) {
    console.error('Error ensuring S3 bucket exists:', err.message || err);
  }
}

async function uploadBuffer(buffer, originalName, contentType) {
  try {
    const ext = path.extname(originalName) || '';
    const key = `animals/${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;

    await s3.putObject({
      Bucket: s3Config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
      ACL: 'public-read'
    }).promise();

    // Construct public URL (MinIO default)
    const endpoint = s3Config.endpoint.replace(/\/*$/, '');
    const url = `${endpoint}/${s3Config.bucket}/${key}`;
    return url;
  } catch (err) {
    console.error('S3 upload error:', err.message || err);
    throw err;
  }
}

module.exports = { ensureBucketExists, uploadBuffer };
