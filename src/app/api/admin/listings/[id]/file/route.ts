import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readModelFile } from "@/lib/upload";

// Lets an admin download a listing's model file for review (works for private storage too).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { slug: true, fileUrl: true },
  });
  if (!listing?.fileUrl) {
    return NextResponse.json({ error: "File not available" }, { status: 404 });
  }

  const buffer = await readModelFile(listing.fileUrl);
  if (!buffer) {
    return NextResponse.json({ error: "File not found on server" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${listing.slug}.3dm"`,
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "private, no-store",
    },
  });
}
