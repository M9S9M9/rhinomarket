import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { extractMetadata } from "@/lib/metadata";

export const MAX_MODEL_BYTES =
  parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || "40") * 1024 * 1024;

// Every Rhino/openNURBS .3dm file starts with this text.
const RHINO_MAGIC = Buffer.from("3D Geometry File Format");

export type ModelCheckResult =
  | { ok: true; hash: string; size: number }
  | { ok: false; status: number; error: string };

/**
 * Validates an uploaded .3dm file:
 *  - it really is a Rhino .3dm file (magic header),
 *  - it isn't a file previously downloaded from the store (forensic watermark),
 *  - it isn't already listed by another designer (SHA-256 match).
 */
export async function checkModelBuffer(buffer: Buffer, designerId: string): Promise<ModelCheckResult> {
  if (buffer.length === 0) {
    return { ok: false, status: 400, error: "The file is empty." };
  }
  if (buffer.length > MAX_MODEL_BYTES) {
    return { ok: false, status: 400, error: `File too large. Maximum size is ${MAX_MODEL_BYTES / (1024 * 1024)}MB.` };
  }
  if (!buffer.subarray(0, RHINO_MAGIC.length).equals(RHINO_MAGIC)) {
    return { ok: false, status: 400, error: "This doesn't look like a valid Rhino .3dm file." };
  }

  // The watermark is appended at the end of downloaded files, so only scan the tail.
  const metadata = extractMetadata(buffer.subarray(Math.max(0, buffer.length - 16 * 1024)));
  if (metadata) {
    return {
      ok: false,
      status: 409,
      error: `This file was originally downloaded by ${metadata.buyerName} (${metadata.buyerEmail}). Re-uploading purchased files is a violation of our terms. If you believe this is a mistake, contact support.`,
    };
  }

  const hash = createHash("sha256").update(buffer).digest("hex");
  const existing = await prisma.listing.findFirst({
    where: { fileHash: hash, designerId: { not: designerId } },
    include: { designer: { select: { name: true } } },
  });
  if (existing) {
    return {
      ok: false,
      status: 409,
      error: `This file appears to already exist in another listing by ${existing.designer.name}. If you believe this is a mistake, contact support.`,
    };
  }

  return { ok: true, hash, size: buffer.length };
}
