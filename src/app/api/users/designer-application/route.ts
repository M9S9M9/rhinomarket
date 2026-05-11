import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const applicationSchema = z.object({
  fullName: z.string().min(2),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  experience: z.string().min(20),
  reason: z.string().min(20),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = applicationSchema.parse(body);

    const existing = await prisma.designerApplication.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      return NextResponse.json({ error: "Application already submitted" }, { status: 409 });
    }

    const application = await prisma.designerApplication.create({
      data: {
        userId: session.user.id,
        ...data,
      },
    });

    return NextResponse.json(application);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const application = await prisma.designerApplication.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(application);
}
