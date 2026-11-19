import { NextResponse } from "next/server";
import { getTopDesigners } from "@/lib/public-data";

export async function GET() {
  return NextResponse.json({ designers: await getTopDesigners() });
}
