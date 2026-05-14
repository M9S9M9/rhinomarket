import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateFile, saveModelFile, savePreviewImage } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "DESIGNER") {
    return NextResponse.json({ error: "Only designers can upload files" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const previews = formData.getAll("previews") as File[];

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validation = validateFile({
      name: file.name,
      size: file.size,
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, hash, size } = await saveModelFile(buffer, file.name);

    const existing = await prisma.listing.findFirst({
      where: { fileHash: hash, designerId: { not: session.user.id } },
      include: { designer: { select: { name: true } } },
    });
    if (existing) {
      return NextResponse.json({
        error: `This file appears to already exist in another listing by ${existing.designer.name}. If you believe this is a mistake, contact support.`,
      }, { status: 409 });
    }

    const previewUrls: string[] = [];
    for (let i = 0; i < previews.length; i++) {
      const previewBuffer = Buffer.from(await previews[i].arrayBuffer());
      const previewUrl = await savePreviewImage(previewBuffer, i);
      previewUrls.push(previewUrl);
    }

    return NextResponse.json({
      fileUrl: url,
      fileHash: hash,
      fileSize: size,
      previewUrls,
      thumbnailUrl: previewUrls[0] || null,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
