import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: body.listingId },
        select: { designerId: true },
      });
      if (listing && listing.designerId === session.user.id) {
        return NextResponse.json({ error: "You cannot report your own model" }, { status: 403 });
      }
    }

    const report = await prisma.dMCAReport.create({
      data: {
        reporterName: body.reporterName,
        reporterEmail: body.reporterEmail,
        infringingUrl: body.infringingUrl,
        originalWorkUrl: body.originalWorkUrl,
        description: body.description,
        listingId: body.listingId || null,
      },
    });
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
