import { createHmac, timingSafeEqual } from "crypto";

/**
 * A signed "upload receipt": proof, issued by the server after it has checked an
 * uploaded model, that this designer uploaded this exact file. Creating a listing
 * requires a valid receipt, so a listing can never point at a file the designer
 * didn't upload themselves (e.g. someone else's model).
 */
export interface UploadReceipt {
  userId: string;
  fileUrl: string;
  fileHash: string;
  fileSize: number;
  previewUrls: string[];
  thumbnailUrl: string | null;
  exp: number; // ms since epoch
}

const VALID_FOR_MS = 24 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(`upload-receipt:${data}`).digest("base64url");
}

export function createUploadReceipt(data: Omit<UploadReceipt, "exp">): string {
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + VALID_FOR_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Returns the receipt if it is genuine, unexpired and belongs to `userId`; otherwise null. */
export function verifyUploadReceipt(token: unknown, userId: string): UploadReceipt | null {
  if (typeof token !== "string") return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const receipt = JSON.parse(Buffer.from(payload, "base64url").toString()) as UploadReceipt;
    if (receipt.userId !== userId) return null;
    if (typeof receipt.exp !== "number" || receipt.exp < Date.now()) return null;
    return receipt;
  } catch {
    return null;
  }
}
