'use strict';

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createLogger } = require('@real-estate/common');
const { MediaModel } = require('@real-estate/db-models');
const { createProducer, TOPICS, EVENT_TYPES } = require('@real-estate/events');
const sharp = require('sharp');

const config = require('./config');

const logger = createLogger({ service: 'media-processor-worker' });

// S3 client
const s3Client = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  forcePathStyle: config.s3.forcePathStyle,
});

// Event producer
let eventProducer = null;

async function getProducer() {
  if (!eventProducer) {
    eventProducer = createProducer({ service: 'media-processor-worker' });
    await eventProducer.connect();
  }
  return eventProducer;
}

/**
 * Download file from S3
 */
async function downloadFromS3(key) {
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  const chunks = [];

  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Upload file to S3
 */
async function uploadToS3(key, buffer, contentType) {
  const command = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return config.s3.cdnBaseUrl + '/' + key;
}

/**
 * Generate derivative key
 */
function generateDerivativeKey(originalKey, size) {
  const parts = originalKey.split('.');
  const extension = parts.pop();
  const baseName = parts.join('.');
  return `${baseName}_${size}.${extension}`;
}

/**
 * Process image
 */
async function processImage(mediaId, originalKey, _mimeType) {
  logger.info({ mediaId, originalKey }, 'Processing image');

  // Download original image
  const imageBuffer = await downloadFromS3(originalKey);

  // Get image metadata
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width;
  const height = metadata.height;

  const derivatives = [];
  const operations = [];

  // Process each size
  for (const [sizeName, dimensions] of Object.entries(config.processing.imageSizes)) {
    try {
      operations.push(`resize_${sizeName}`);

      // Resize image
      let processedImage = sharp(imageBuffer);

      // Maintain aspect ratio
      if (dimensions.width && dimensions.height) {
        processedImage = processedImage.resize(dimensions.width, dimensions.height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Strip metadata if configured
      if (config.processing.stripMetadata) {
        processedImage = processedImage.withMetadata({});
      }

      // Generate JPEG version
      const jpegBuffer = await processedImage
        .jpeg({ quality: config.processing.quality.jpeg })
        .toBuffer();

      const jpegKey = generateDerivativeKey(originalKey, `${sizeName}_jpg`);
      const jpegUrl = await uploadToS3(jpegKey, jpegBuffer, 'image/jpeg');

      derivatives.push({
        size: sizeName,
        key: jpegKey,
        url: jpegUrl,
        width: dimensions.width,
        height: dimensions.height,
        format: 'jpeg',
      });

      // Generate WebP version (for better compression)
      if (sizeName !== 'thumbnail') {
        const webpBuffer = await processedImage
          .webp({ quality: config.processing.quality.webp })
          .toBuffer();

        const webpKey = generateDerivativeKey(originalKey, `${sizeName}_webp`);
        const webpUrl = await uploadToS3(webpKey, webpBuffer, 'image/webp');

        derivatives.push({
          size: sizeName === 'original' ? 'webp' : `${sizeName}_webp`,
          key: webpKey,
          url: webpUrl,
          width: dimensions.width,
          height: dimensions.height,
          format: 'webp',
        });
      }
    } catch (error) {
      logger.error({ error, sizeName, mediaId }, `Failed to process ${sizeName} size`);
    }
  }

  // Update media record
  await MediaModel.findByIdAndUpdate(mediaId, {
    $set: {
      status: 'READY',
      dimensions: { width, height },
      derivatives,
      'metadata.exifStripped': config.processing.stripMetadata,
      processedAt: new Date(),
    },
  });

  // Emit processing completed event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.MEDIA,
    EVENT_TYPES.MEDIA.PROCESSING_COMPLETED,
    {
      mediaId,
      derivatives,
      dimensions: { width, height },
      metadata: {
        exifStripped: config.processing.stripMetadata,
      },
      completedAt: new Date().toISOString(),
    },
    { key: mediaId }
  );

  logger.info({ mediaId, operations }, 'Image processing completed');
}

/**
 * Process video (placeholder - would need ffmpeg)
 */
async function processVideo(mediaId, originalKey, _mimeType) {
  logger.info({ mediaId, originalKey }, 'Video processing not implemented yet');
  // TODO: Implement video processing with ffmpeg
  // For now, just mark as ready
  await MediaModel.findByIdAndUpdate(mediaId, {
    $set: {
      status: 'READY',
      processedAt: new Date(),
    },
  });
}

/**
 * Process media file
 */
async function processMedia(payload) {
  const { mediaId, mimeType, key } = payload;

  try {
    // Update status to PROCESSING
    await MediaModel.findByIdAndUpdate(mediaId, {
      $set: { status: 'PROCESSING' },
    });

    // Emit processing started event
    const producer = await getProducer();
    await producer.publish(
      TOPICS.MEDIA,
      EVENT_TYPES.MEDIA.PROCESSING_STARTED,
      {
        mediaId,
        processorId: process.pid.toString(),
        operations: mimeType.startsWith('image/') ? ['resize', 'optimize', 'webp'] : ['transcode'],
        startedAt: new Date().toISOString(),
      },
      { key: mediaId }
    );

    // Process based on type
    if (mimeType.startsWith('image/')) {
      await processImage(mediaId, key, mimeType);
    } else if (mimeType.startsWith('video/')) {
      await processVideo(mediaId, key, mimeType);
    } else {
      // For documents, just mark as ready
      await MediaModel.findByIdAndUpdate(mediaId, {
        $set: {
          status: 'READY',
          processedAt: new Date(),
        },
      });
    }
  } catch (error) {
    logger.error({ error, mediaId }, 'Media processing failed');

    // Update status to FAILED
    await MediaModel.findByIdAndUpdate(mediaId, {
      $set: {
        status: 'FAILED',
        processingError: error.message,
      },
    });

    // Emit processing failed event
    const producer = await getProducer();
    await producer.publish(
      TOPICS.MEDIA,
      EVENT_TYPES.MEDIA.PROCESSING_FAILED,
      {
        mediaId,
        error: error.message,
        errorCode: error.code || 'PROCESSING_ERROR',
        retryCount: 0,
        failedAt: new Date().toISOString(),
      },
      { key: mediaId }
    );

    throw error;
  }
}

module.exports = {
  processMedia,
};
