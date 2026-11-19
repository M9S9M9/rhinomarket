import { NextResponse } from "next/server";
import { getCategoriesWithCounts } from "@/lib/public-data";

export async function GET() {
  return NextResponse.json(await getCategoriesWithCounts());
}
