import { NextRequest, NextResponse } from "next/server";
import { validateFile, saveModelFile, savePreviewImage } from "@/lib/upload";
import { checkModelBuffer } from "@/lib/model-check";
import { createUploadReceipt } from "@/lib/upload-receipt";
import { requireUploadingDesigner } from "@/lib/designer-guard";

// Classic upload: the file is sent through this function. On Vercel this only works for
// small files (request body limit ≈4.5 MB); the upload page uses the direct-to-storage
// flow (/api/upload/model + /api/upload/finalize) whenever private storage is configured.

export async function POST(req: NextRequest) {
  const guard = await requireUploadingDesigner();
  if (!guard.ok) return guard.response;
  const designerId = guard.user.id;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const previews = formData.getAll("previews") as File[];

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validation = validateFile({ name: file.name, size: file.size });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate every preview before storing any file.
    for (const preview of previews) {
      if (!/\.(jpe?g|png)$/i.test(preview.name) ||
          (preview.type !== "image/jpeg" && preview.type !== "image/png")) {
        return NextResponse.json({
          error: `"${preview.name}" is not a valid preview image. Only JPG and PNG files are allowed.`,
        }, { status: 400 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Real .3dm file, not a re-uploaded purchase, not a duplicate of another designer's file.
    const check = await checkModelBuffer(buffer, designerId);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const { url, hash, size } = await saveModelFile(buffer, file.name);

    const previewUrls: string[] = [];
    for (let i = 0; i < previews.length; i++) {
      const previewBuffer = Buffer.from(await previews[i].arrayBuffer());
      previewUrls.push(await savePreviewImage(previewBuffer, i));
    }
    const thumbnailUrl = previewUrls[0] || null;

    const uploadReceipt = createUploadReceipt({
      userId: designerId,
      fileUrl: url,
      fileHash: hash,
      fileSize: size,
      previewUrls,
      thumbnailUrl,
    });

    return NextResponse.json({
      fileUrl: url,
      fileHash: hash,
      fileSize: size,
      previewUrls,
      thumbnailUrl,
      uploadReceipt,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
