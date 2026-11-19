"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PlayCircle, X } from "lucide-react";
import { GUIDE_VIDEOS, type GuideVideoKey } from "@/lib/videos";

/**
 * A link that opens one of the guide videos in a pop-up player.
 * The video file is only loaded when someone clicks.
 */
export function VideoLink({
  video,
  label,
  className = "",
  iconClassName = "h-4 w-4",
}: {
  video: GuideVideoKey;
  label?: string;
  className?: string;
  iconClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const v = GUIDE_VIDEOS[video];
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`inline-flex items-center gap-1.5 text-left ${className}`}>
        <PlayCircle className={`shrink-0 ${iconClassName}`} aria-hidden="true" />
        {label ?? v.title}
      </button>
      {open && <VideoModal video={video} onClose={() => setOpen(false)} />}
    </>
  );
}

function VideoModal({ video, onClose }: { video: GuideVideoKey; onClose: () => void }) {
  const v = GUIDE_VIDEOS[video];
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={v.title}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-lg">{v.title}</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close video"
            className="rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <video
          className="w-full rounded-xl bg-black shadow-2xl"
          src={v.src}
          poster={v.poster}
          controls
          autoPlay
          playsInline
          preload="auto"
        />
      </div>
    </div>,
    document.body
  );
}
