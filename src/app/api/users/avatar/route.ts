import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveAvatarImage } from "@/lib/upload";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, and GIF images are allowed" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Image too large. Maximum size is 5MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const buffer = Buffer.from(await file.arrayBuffer());
    const avatarUrl = await saveAvatarImage(buffer, `.${ext}`);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
    });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
