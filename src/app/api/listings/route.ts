import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify, normalizeListing } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const licenseType = searchParams.get("licenseType");
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "24");
  const designerId = searchParams.get("designerId");

  const where: any = { status: "APPROVED" };

  if (query) {
    where.OR = [
      { title: { contains: query } },
      { description: { contains: query } },
    ];
  }

  if (category) where.category = { slug: category };
  if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) };
  if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };
  if (licenseType) where.licenseType = licenseType;
  if (designerId) where.designerId = designerId;

  const orderBy: any =
    sort === "popular" ? { viewCount: "desc" } :
    sort === "price_asc" ? { price: "asc" } :
    sort === "price_desc" ? { price: "desc" } :
    { publishedAt: "desc" };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        designer: { select: { id: true, name: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { reviews: true, favorites: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({
    listings: listings.map(normalizeListing),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "DESIGNER") {
    return NextResponse.json({ error: "Only designers can create listings" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title, description, tags, categoryId, price, licenseType,
      fileUrl, fileSize, fileHash, previewUrls, thumbnailUrl,
      polyCount, rhinocerosVersion, copyrightConfirmed,
    } = body;

    if (!copyrightConfirmed) {
      return NextResponse.json({ error: "You must confirm copyright ownership" }, { status: 400 });
    }

    let slug = slugify(title);
    const existing = await prisma.listing.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const listing = await prisma.listing.create({
      data: {
        designerId: session.user.id,
        title, slug, description,
        tags: JSON.stringify(tags || []),
        categoryId: categoryId || null,
        price: parseFloat(price),
        licenseType: licenseType || "PERSONAL",
        status: "PENDING_REVIEW",
        fileUrl, fileSize: fileSize ? parseInt(fileSize) : null,
        fileHash, previewUrls: JSON.stringify(previewUrls || []),
        thumbnailUrl,
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
