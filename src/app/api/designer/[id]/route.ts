import { NextResponse } from "next/server";
import { getDesignerProfile } from "@/lib/public-data";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getDesignerProfile(id);
  if (!data) return NextResponse.json({ error: "Designer not found" }, { status: 404 });
  return NextResponse.json(data);
}
