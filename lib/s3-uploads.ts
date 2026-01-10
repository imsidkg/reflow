import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";

const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

if (
  !AWS_REGION ||
  !AWS_ACCESS_KEY_ID ||
  !AWS_SECRET_ACCESS_KEY ||
  !BUCKET_NAME
) {
  throw new Error(
    "Missing required AWS environment variables: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME"
  );
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

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

function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const randomString = randomBytes(8).toString("hex"); 
  const extensionMatch = originalFilename.match(/\.[^.]+$/);
  const extension = extensionMatch ? extensionMatch[0] : "";
  return `${timestamp}-${randomString}${extension}`;
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
  try {
    const folder = config.folder || "mood-board";
    const uniqueFilename = generateUniqueFilename(filename);
    const key = `${folder}/${uniqueFilename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    const fileUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
  } catch (error: any) {
    console.error("Failed to generate presigned URL:", error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
}

export async function uploadToS3(
  file: Buffer,
  filename: string,
  contentType: string,
  config: UploadConfig = {}
): Promise<{ fileUrl: string; key: string }> {
  const validation = validateFileType(contentType, file.length, config);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    const folder = config.folder || "mood-board";
    const uniqueFilename = generateUniqueFilename(filename);
    const key = `${folder}/${uniqueFilename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const fileUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    return { fileUrl, key };
  } catch (error: any) {
    console.error("S3 upload failed:", error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
}

export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error: any) {
    console.error("S3 delete failed:", error);
    throw new Error(`Failed to delete from S3: ${error.message}`);
  }
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

