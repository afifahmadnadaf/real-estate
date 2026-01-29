'use strict';

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const config = require('../config');

/**
 * S3/MinIO client
 */
const s3Client = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  forcePathStyle: config.s3.forcePathStyle,
});

/**
 * Generate a unique key for file storage
 */
function generateKey(prefix, filename, userId) {
  const timestamp = Date.now();
  const randomId = uuidv4().substring(0, 8);
  const extension = filename.split('.').pop();
  const baseName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
  return `${prefix}/${userId}/${timestamp}-${randomId}-${baseName}.${extension}`;
}

/**
 * Generate presigned URL for upload
 */
async function generatePresignedUploadUrl(key, contentType, expiresIn = null) {
  const command = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    ContentType: contentType,
  });

  const expiry = expiresIn || config.upload.presignedUrlExpiry;
  const url = await getSignedUrl(s3Client, command, { expiresIn: expiry });

  return {
    url,
    key,
    bucket: config.s3.bucket,
    expiresIn: expiry,
  };
}

/**
 * Generate presigned URL for download
 */
async function generatePresignedDownloadUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    url,
    expiresIn,
  };
}

/**
 * Generate CDN URL
 */
function generateCdnUrl(key) {
  return `${config.s3.cdnBaseUrl}/${key}`;
}

/**
 * Check if object exists
 */
async function objectExists(key) {
  try {
    const command = new HeadObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Delete object from S3
 */
async function deleteObject(key) {
  const command = new DeleteObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Get object metadata
 */
async function getObjectMetadata(key) {
  const command = new HeadObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  return {
    size: response.ContentLength,
    contentType: response.ContentType,
    lastModified: response.LastModified,
    etag: response.ETag,
  };
}

module.exports = {
  s3Client,
  generateKey,
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  generateCdnUrl,
  objectExists,
  deleteObject,
  getObjectMetadata,
};
