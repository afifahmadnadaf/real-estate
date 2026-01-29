'use strict';

module.exports = {
  port: parseInt(process.env.MEDIA_SERVICE_PORT, 10) || 3005,
  env: process.env.NODE_ENV || 'development',

  // MongoDB
  mongo: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017/real_estate',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // S3/MinIO Configuration
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'real-estate-media',
    forcePathStyle: true, // Required for MinIO
    cdnBaseUrl: process.env.CDN_BASE_URL || 'http://localhost:9000/real-estate-media',
  },

  // Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'media-service',
  },

  // Upload limits
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 100 * 1024 * 1024, // 100MB
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/webm'],
    allowedDocumentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    presignedUrlExpiry: parseInt(process.env.PRESIGNED_URL_EXPIRY, 10) || 3600, // 1 hour
  },
};
