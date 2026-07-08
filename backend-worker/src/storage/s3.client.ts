import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: 'us-east-1', // MinIO ignores this, but the SDK insists on having one
  endpoint: process.env.S3_ENDPOINT, // points at MinIO instead of real AWS
  forcePathStyle: true, // MinIO needs this style of URL
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

export const REPORTS_BUCKET = process.env.S3_BUCKET || 'reports';
