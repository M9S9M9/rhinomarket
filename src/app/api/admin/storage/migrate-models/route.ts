import { NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Moves .3dm model files from the PUBLIC Blob store into the PRIVATE one
// (BLOB_MODELS_READ_WRITE_TOKEN), then deletes the public copy so old links stop working.
// Admin-only. Runs in small batches; call POST repeatedly until `remaining` is 0.

export const maxDuration = 60;

const BATCH_SIZE = 5;
const PUBLIC_MODEL_URL = ".public.blob.vercel-storage.com/models/";

async function requireAdmin() {
  const session = await auth();
  return (session?.user as any)?.role === "ADMIN";
}

async function counts() {
  const [publicModels, privateModels] = await Promise.all([
    prisma.listing.count({ where: { fileUrl: { contains: PUBLIC_MODEL_URL } } }),
    prisma.listing.count({ where: { fileUrl: { contains: ".private.blob.vercel-storage.com/" } } }),
  ]);
  return { publicModels, privateModels };
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    privateStoreConfigured: !!process.env.BLOB_MODELS_READ_WRITE_TOKEN,
    ...(await counts()),
  });
}

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const privateToken = process.env.BLOB_MODELS_READ_WRITE_TOKEN;
  if (!privateToken) {
    return NextResponse.json(
      { error: "Private store not connected (BLOB_MODELS_READ_WRITE_TOKEN missing). Connect it in Vercel and redeploy." },
      { status: 400 }
    );
  }

  const { put, del } = await import("@vercel/blob");

  const batch = await prisma.listing.findMany({
    where: { fileUrl: { contains: PUBLIC_MODEL_URL } },
    select: { id: true, title: true, fileUrl: true, fileHash: true },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  let migrated = 0;
  const failed: { id: string; title: string; error: string }[] = [];

  for (const listing of batch) {
    const oldUrl = listing.fileUrl as string;
    try {
      const resp = await fetch(oldUrl);
      if (!resp.ok) throw new Error(`could not read public file (HTTP ${resp.status})`);
      const buffer = Buffer.from(await resp.arrayBuffer());

      // Make sure we copy exactly the file the listing was approved with.
      const hash = createHash("sha256").update(buffer).digest("hex");
      if (listing.fileHash && listing.fileHash !== hash) {
        throw new Error("file content does not match the stored SHA-256 hash");
      }

      const blob = await put(`models/${randomUUID()}.3dm`, buffer, {
        access: "private",
        token: privateToken,
        contentType: "application/octet-stream",
      });

      // Only switch the listing if nobody changed its file in the meantime.
      const updated = await prisma.listing.updateMany({
        where: { id: listing.id, fileUrl: oldUrl },
        data: { fileUrl: blob.url },
      });
      if (updated.count === 0) {
        await del(blob.url, { token: privateToken });
        throw new Error("listing file changed during the move; skipped");
      }

      // Remove the public copy so any previously leaked link stops working.
      try {
        await del(oldUrl);
      } catch (err: any) {
        console.error(`Moved ${listing.id} but could not delete public copy:`, err);
      }

      migrated++;
    } catch (err: any) {
      failed.push({ id: listing.id, title: listing.title, error: err?.message || String(err) });
    }
  }

  const { publicModels } = await counts();
  return NextResponse.json({
    migrated,
    failed,
    // If every file in this batch failed, report done to avoid an endless loop.
    remaining: migrated === 0 && failed.length > 0 ? 0 : publicModels,
    stillPublic: publicModels,
  });
}
