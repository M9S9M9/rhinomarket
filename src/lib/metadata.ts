const METADATA_HEADER = "3DMSTORE_METADATA";
const METADATA_FOOTER = "3DMSTORE_METADATA_END";

export function embedMetadata(
  buffer: Buffer,
  data: { buyerName: string; buyerEmail: string; transactionId: string; listingId: string; downloadedAt: string }
): Buffer {
  const json = JSON.stringify(data);
  const metadataStr = `\n${METADATA_HEADER}\n${json}\n${METADATA_FOOTER}\n`;
  return Buffer.concat([buffer, Buffer.from(metadataStr)]);
}

export function extractMetadata(buffer: Buffer): { buyerName: string; buyerEmail: string; transactionId: string; listingId: string; downloadedAt: string } | null {
  const content = buffer.toString("utf-8");
  const startIdx = content.lastIndexOf(METADATA_HEADER);
  if (startIdx === -1) return null;
  const endIdx = content.lastIndexOf(METADATA_FOOTER);
  if (endIdx === -1) return null;
  const jsonStart = startIdx + METADATA_HEADER.length + 1;
  const jsonStr = content.slice(jsonStart, endIdx).trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}
