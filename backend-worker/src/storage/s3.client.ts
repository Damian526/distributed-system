import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: 'us-east-1', // required by SDK, irrelevant for MinIO
  endpoint: process.env.S3_ENDPOINT, // http://minio:9000
  forcePathStyle: true, // required for MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

export const REPORTS_BUCKET = process.env.S3_BUCKET || 'reports';
