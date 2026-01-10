import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;

const ALLOWED_FILE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface UploadConfig {
  maxSize?: number;
  allowedTypes?: string[];
  folder?: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

function generateUniqueFilename(originalFilename: string) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalFilename.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
}

function validateFileType(
  contentType: string,
  fileSize: number,
  config: UploadConfig = {}
): { valid: boolean; error?: string } {
  const allowedTypes = config.allowedTypes || Object.keys(ALLOWED_FILE_TYPES);
  const maxSize = config.maxSize || MAX_FILE_SIZE;

  if (!allowedTypes.includes(contentType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

export async function generatePresignedUrl(
  filename: string,
  contentType: string,
  config: UploadConfig = {}
): Promise<PresignedUrlResult> {
  const folder = config.folder || "uploads";
  const uniqueFilename = generateUniqueFilename(filename);
  const key = `${folder}/${uniqueFilename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key };
}

export async function uploadToS3(
  file: Buffer,
  filename: string,
  contentType: string,
  config: UploadConfig = {}
): Promise<{ fileUrl: string; key: string }> {
  const folder = config.folder || "uploads";
  const uniqueFilename = generateUniqueFilename(filename);
  const key = `${folder}/${uniqueFilename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);

  const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
  return { fileUrl, key };
}

export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    return pathParts.slice(1).join("/");
  } catch {
    return null;
  }
}
