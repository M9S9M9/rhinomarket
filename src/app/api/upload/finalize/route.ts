import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readModelFile, savePreviewImage, isOwnPrivateModelUrl, deleteModelFile } from "@/lib/upload";
import { checkModelBuffer } from "@/lib/model-check";
import { createUploadReceipt } from "@/lib/upload-receipt";
import { requireUploadingDesigner } from "@/lib/designer-guard";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

// Called after the browser has uploaded a .3dm file directly to private storage.
// Reads the file back, runs the same checks as a normal upload (deleting the file if
// it fails), stores the preview images, and returns a signed upload receipt that
// /api/listings requires.

export const maxDuration = 60;

const MAX_PREVIEWS = 10;

export async function POST(req: Request) {
  const rlKey = await getRateLimitKey(req);
  if (!(await checkRateLimit(rlKey, "upload"))) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const guard = await requireUploadingDesigner();
  if (!guard.ok) return guard.response;
  const designerId = guard.user.id;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload. Preview images may be too large." }, { status: 400 });
  }

  const fileUrl = String(formData.get("fileUrl") || "");
  const previews = (formData.getAll("previews") as File[]).slice(0, MAX_PREVIEWS);

  if (!isOwnPrivateModelUrl(fileUrl)) {
    return NextResponse.json({ error: "Invalid file reference" }, { status: 400 });
  }

  if (previews.length === 0) {
    await deleteModelFile(fileUrl);
    return NextResponse.json(
      { error: "Add at least one preview image (JPG or PNG) so buyers can see your model." },
      { status: 400 }
    );
  }

  const inUse = await prisma.listing.findFirst({ where: { fileUrl }, select: { id: true } });
  if (inUse) {
    return NextResponse.json({ error: "This file is already attached to a listing" }, { status: 409 });
  }

  for (const preview of previews) {
    if (!/\.(jpe?g|png)$/i.test(preview.name) || (preview.type !== "image/jpeg" && preview.type !== "image/png")) {
      return NextResponse.json(
        { error: `"${preview.name}" is not a valid preview image. Only JPG and PNG files are allowed.` },
        { status: 400 }
      );
    }
  }

  let buffer: Buffer | null;
  try {
    buffer = await readModelFile(fileUrl);
  } catch (err) {
    console.error("Finalize read error:", err);
    buffer = null;
  }
  if (!buffer) {
    return NextResponse.json({ error: "Uploaded file not found. Please upload it again." }, { status: 404 });
  }

  const check = await checkModelBuffer(buffer, designerId);
  if (!check.ok) {
    await deleteModelFile(fileUrl);
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const previewUrls: string[] = [];
  for (let i = 0; i < previews.length; i++) {
    const previewBuffer = Buffer.from(await previews[i].arrayBuffer());
    previewUrls.push(await savePreviewImage(previewBuffer, i));
  }
  const thumbnailUrl = previewUrls[0] || null;

  const uploadReceipt = createUploadReceipt({
    userId: designerId,
    fileUrl,
    fileHash: check.hash,
    fileSize: check.size,
    previewUrls,
    thumbnailUrl,
  });

  return NextResponse.json({
    fileUrl,
    fileHash: check.hash,
    fileSize: check.size,
    previewUrls,
    thumbnailUrl,
    uploadReceipt,
  });
}
