import { NextResponse } from "next/server";

const MAX_BODY_BYTES: Record<string, number> = {
  "default": 1024 * 1024,
  "/api/listings": 5 * 1024 * 1024,
  "/api/upload": 500 * 1024 * 1024,
};

export async function validateApiRequest(req: Request): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  if (["POST", "PATCH", "PUT"].includes(method)) {
    const ct = req.headers.get("content-type") || "";
    const isMultipart = ct.includes("multipart/form-data");
    if (ct && !isMultipart && !ct.includes("application/json")) {
      return { ok: false, response: NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 }) };
    }

    if (!isMultipart) {
      const cl = req.headers.get("content-length");
      if (cl) {
        const maxBytes = Object.entries(MAX_BODY_BYTES).find(([k]) => path.startsWith(k))?.[1] || MAX_BODY_BYTES.default;
        if (parseInt(cl) > maxBytes) {
          return { ok: false, response: NextResponse.json({ error: "Request body too large" }, { status: 413 }) };
        }
      }
    }
  }

  return { ok: true };
}
