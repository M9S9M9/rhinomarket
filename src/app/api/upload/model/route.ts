import { NextResponse } from "next/server";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { issueSignedToken } from "@vercel/blob";
import { getModelsBlobAuth } from "@/lib/upload";
import { MAX_MODEL_BYTES } from "@/lib/model-check";
import { requireUploadingDesigner } from "@/lib/designer-guard";

// Lets a designer's browser upload a .3dm file straight into the PRIVATE model store,
// so large files don't pass through (and hit the size limit of) a serverless function.
// The file is checked afterwards by /api/upload/finalize.

const PATHNAME_RE = /^models\/[0-9a-f-]{36}\.3dm$/i;

/** Tells the upload page whether direct (large-file) uploads are available. */
export async function GET() {
  return NextResponse.json({
    direct: !!getModelsBlobAuth(),
    maxBytes: MAX_MODEL_BYTES,
  });
}

export async function POST(request: Request) {
  const modelsAuth = getModelsBlobAuth();
  if (!modelsAuth) {
    return NextResponse.json({ error: "Direct uploads are not configured" }, { status: 400 });
  }

  let body: HandleUploadPresignedBody;
  try {
    body = (await request.json()) as HandleUploadPresignedBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Only issue upload permissions to an active designer under their limit.
  if (body.type === "blob.generate-presigned-url") {
    const guard = await requireUploadingDesigner();
    if (!guard.ok) return guard.response;
  }

  try {
    const result = await handleUploadPresigned({
      body,
      request,
      webhookPublicKey: process.env.BLOB_MODELS_WEBHOOK_PUBLIC_KEY,
      getSignedToken: async (pathname, clientPayload) => {
        if (!PATHNAME_RE.test(pathname)) {
          throw new Error("Invalid file name");
        }
        const declaredSize = Number(JSON.parse(clientPayload || "{}").size || 0);
        if (declaredSize > MAX_MODEL_BYTES) {
          throw new Error(`File too large. Maximum size is ${MAX_MODEL_BYTES / (1024 * 1024)}MB.`);
        }

        const token = await issueSignedToken({
          ...modelsAuth,
          pathname,
          operations: ["put"],
          validUntil: Date.now() + 30 * 60 * 1000,
          maximumSizeInBytes: MAX_MODEL_BYTES,
        });
        return {
          token,
          urlOptions: {
            maximumSizeInBytes: MAX_MODEL_BYTES,
            allowOverwrite: false,
            addRandomSuffix: false,
          },
        };
      },
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Direct upload authorization error:", error);
    return NextResponse.json({ error: error?.message || "Upload not allowed" }, { status: 400 });
  }
}
