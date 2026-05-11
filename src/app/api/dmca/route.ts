import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
