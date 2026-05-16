import { randomUUID, createHash } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MODELS_DIR = path.join(UPLOAD_DIR, "models");
const PREVIEWS_DIR = path.join(UPLOAD_DIR, "previews");

const MAX_FILE_SIZE = (parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || "500")) * 1024 * 1024;
const ALLOWED_TYPES = [".3dm"];

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const useS3 = !!process.env.S3_ENDPOINT;

async function ensureDir(dir: string) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

export function validateFile(file: { name: string; size: number }): {
  valid: boolean;
  error?: string;
} {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_TYPES.includes(ext)) {
    return { valid: false, error: `Invalid file type. Only ${ALLOWED_TYPES.join(", ")} files are allowed.` };
  }
  if (file.size > MAX_FILE_SIZE) {
    const maxMb = MAX_FILE_SIZE / (1024 * 1024);
    return { valid: false, error: `File too large. Maximum size is ${maxMb}MB.` };
  }
  return { valid: true };
}

export async function saveModelFile(
  buffer: Buffer,
  originalName: string
): Promise<{ url: string; hash: string; size: number }> {
  const hash = createHash("sha256").update(buffer).digest("hex");
  const ext = path.extname(originalName);
  const uniqueName = `${randomUUID()}${ext}`;

  if (useBlob) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`models/${uniqueName}`, buffer, {
      access: "public",
      contentType: "application/octet-stream",
    });
    return { url: blob.url, hash, size: buffer.length };
  }

  if (useS3) {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || "auto",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
    const bucket = process.env.S3_BUCKET || "3dmstore";
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `models/${uniqueName}`,
      Body: buffer,
      ContentType: "application/octet-stream",
    }));
    return {
      url: `${process.env.S3_PUBLIC_URL || `https://${bucket}.${process.env.S3_ENDPOINT}`}/models/${uniqueName}`,
      hash,
      size: buffer.length,
    };
  }

  await ensureDir(MODELS_DIR);
  const filePath = path.join(MODELS_DIR, uniqueName);
  await writeFile(filePath, buffer);
  return { url: `/uploads/models/${uniqueName}`, hash, size: buffer.length };
}

export async function savePreviewImage(
  buffer: Buffer,
  index: number = 0
): Promise<string> {
  const uniqueName = `${randomUUID()}-${index}.webp`;

  if (useBlob) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`previews/${uniqueName}`, buffer, {
      access: "public",
      contentType: "image/webp",
    });
    return blob.url;
  }

  if (useS3) {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || "auto",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
    const bucket = process.env.S3_BUCKET || "3dmstore";
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `previews/${uniqueName}`,
      Body: buffer,
      ContentType: "image/webp",
    }));
    return `${process.env.S3_PUBLIC_URL || `https://${bucket}.${process.env.S3_ENDPOINT}`}/previews/${uniqueName}`;
  }

  await ensureDir(PREVIEWS_DIR);
  const filePath = path.join(PREVIEWS_DIR, uniqueName);
  await writeFile(filePath, buffer);
  return `/uploads/previews/${uniqueName}`;
}

export function getModelPath(relativeUrl: string): string {
  if (relativeUrl.startsWith("http")) return relativeUrl;
  return path.join(UPLOAD_DIR, relativeUrl.replace("/uploads/", ""));
}
