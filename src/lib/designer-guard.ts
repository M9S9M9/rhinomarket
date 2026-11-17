import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Checks that the signed-in user is an active designer who still has room under
 * their upload limit. Returns the user, or a ready-to-send error response.
 */
export async function requireUploadingDesigner(): Promise<
  { ok: true; user: { id: string; uploadLimit: number } } | { ok: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isActive: true, uploadLimit: true },
  });
  if (user?.role !== "DESIGNER") {
    return { ok: false, response: NextResponse.json({ error: "Only designers can upload files" }, { status: 403 }) };
  }
  if (!user.isActive) {
    return { ok: false, response: NextResponse.json({ error: "Account restricted. Contact support." }, { status: 403 }) };
  }
  const listingCount = await prisma.listing.count({ where: { designerId: user.id } });
  if (listingCount >= user.uploadLimit) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Upload limit reached (${user.uploadLimit}). Contact an admin to increase your limit.` },
        { status: 403 }
      ),
    };
  }
  return { ok: true, user: { id: user.id, uploadLimit: user.uploadLimit } };
}
