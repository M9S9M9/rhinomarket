import { Box } from "lucide-react";

/** Shown where a listing has no preview image yet. */
export function NoPreview({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  if (size === "sm") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
        <Box className="h-6 w-6" strokeWidth={1.5} />
      </div>
    );
  }
  const big = size === "lg";
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 text-gray-400">
      <Box className={big ? "h-16 w-16" : "h-10 w-10"} strokeWidth={1.25} />
      <span className={`font-mono font-semibold tracking-wide text-gray-500 ${big ? "text-sm" : "text-xs"}`}>.3dm</span>
      <span className={big ? "text-sm" : "text-[11px]"}>Preview coming soon</span>
    </div>
  );
}
