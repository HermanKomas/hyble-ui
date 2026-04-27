import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../env.js';
import { randomUUID } from 'crypto';

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

export async function uploadBuffer(
  buffer: Buffer,
  contentType: string,
  folder: 'generated' | 'uploads' = 'generated',
): Promise<string> {
  const ext = contentType.includes('png') ? 'png' : contentType.includes('pdf') ? 'pdf' : 'jpg';
  const key = `${folder}/${randomUUID()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return key;
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
    { expiresIn },
  );
}

export async function downloadToBuffer(key: string): Promise<Buffer> {
  const res = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  const chunks: Uint8Array[] = [];
  for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}

/** Returns a public-style URL proxied through our API */
export function imageApiUrl(key: string): string {
  return `${env.PUBLIC_URL}/api/images/${encodeURIComponent(key)}`;
}
