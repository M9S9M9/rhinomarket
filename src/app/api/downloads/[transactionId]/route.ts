import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest, { params }: { params: Promise<{ transactionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transactionId } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { listing: true },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (transaction.buyerId !== session.user.id && transaction.designerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (transaction.status !== "COMPLETED" && transaction.designerId !== session.user.id) {
    return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
  }

  if (!transaction.listing.fileUrl) {
    return NextResponse.json({ error: "File not available" }, { status: 404 });
  }

  await prisma.download.create({
    data: {
      transactionId: transaction.id,
      userId: session.user.id,
      listingId: transaction.listingId,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    },
  });

  await prisma.listing.update({
    where: { id: transaction.listingId },
    data: { downloadCount: { increment: 1 } },
  });

  const fileUrl = transaction.listing.fileUrl;

  if (fileUrl.startsWith("http")) {
    return NextResponse.redirect(fileUrl);
  }

  const filePath = path.join(process.cwd(), "uploads", fileUrl.replace("/uploads/", ""));

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found on server" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = `${transaction.listing.slug}.3dm`;

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": fileBuffer.length.toString(),
    },
  });
}
