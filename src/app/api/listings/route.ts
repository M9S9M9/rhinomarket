import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify, normalizeListing, toPublicListing } from "@/lib/utils";
import { verifyUploadReceipt } from "@/lib/upload-receipt";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { validateApiRequest } from "@/lib/validate-request";
import { getPublicListings } from "@/lib/public-data";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await getPublicListings({
    query: sp.get("query") || "",
    category: sp.get("category") || "",
    minPrice: sp.get("minPrice"),
    maxPrice: sp.get("maxPrice"),
    licenseType: sp.get("licenseType"),
    sort: sp.get("sort") || "newest",
    page: parseInt(sp.get("page") || "1") || 1,
    limit: parseInt(sp.get("limit") || "24") || 24,
    designerId: sp.get("designerId"),
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const validation = await validateApiRequest(req);
  if (!validation.ok) return validation.response;

  const rlKey = await getRateLimitKey(req);
  if (!(await checkRateLimit(rlKey, "upload"))) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "DESIGNER") {
    return NextResponse.json({ error: "Only designers can create listings" }, { status: 403 });
  }
  if (!user?.isActive) {
    return NextResponse.json({ error: "Account restricted. Contact support." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title, description, tags, categoryId, price, licenseType,
      polyCount, rhinocerosVersion, copyrightConfirmed, uploadReceipt,
    } = body;

    // The model file and images must come from this designer's own checked upload.
    // File details are taken from the signed receipt, never from the request body.
    const receipt = verifyUploadReceipt(uploadReceipt, session.user.id);
    if (!receipt) {
      return NextResponse.json(
        { error: "Upload not found or expired. Please upload your model file again." },
        { status: 400 }
      );
    }
    const alreadyListed = await prisma.listing.findFirst({
      where: { fileUrl: receipt.fileUrl },
      select: { id: true },
    });
    if (alreadyListed) {
      return NextResponse.json({ error: "This uploaded file is already used by a listing" }, { status: 409 });
    }

    if (!copyrightConfirmed) {
      return NextResponse.json({ error: "You must confirm copyright ownership" }, { status: 400 });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
    }

    let slug = slugify(title);
    const existing = await prisma.listing.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const listing = await prisma.listing.create({
      data: {
        designerId: session.user.id,
        title, slug, description,
        tags: tags || [],
        categoryId: categoryId || null,
        price: parsedPrice,
        licenseType: licenseType || "PERSONAL",
        status: "PENDING_REVIEW",
        fileUrl: receipt.fileUrl,
        fileSize: receipt.fileSize,
        fileHash: receipt.fileHash,
        previewUrls: receipt.previewUrls,
        thumbnailUrl: receipt.thumbnailUrl,
        polyCount: polyCount ? parseInt(polyCount) : null,
        rhinocerosVersion,
        copyrightConfirmed,
      },
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Create listing error:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
