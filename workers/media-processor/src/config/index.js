'use strict';

module.exports = {
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
    forcePathStyle: true,
    cdnBaseUrl: process.env.CDN_BASE_URL || 'http://localhost:9000/real-estate-media',
  },

  // Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'media-processor-worker',
    groupId: process.env.KAFKA_GROUP_ID || 'media-processor-group',
  },

  // Processing configuration
  processing: {
    imageSizes: {
      thumbnail: { width: 200, height: 200 },
      small: { width: 400, height: 400 },
      medium: { width: 800, height: 800 },
      large: { width: 1200, height: 1200 },
    },
    quality: {
      jpeg: 85,
      webp: 85,
    },
    stripMetadata: true,
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_PROCESSING, 10) || 5,
  },
};
