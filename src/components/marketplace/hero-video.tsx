"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Homepage hero video: each category being modeled in a Rhino 8-style viewport.
 * Silent, looping, inline. Visitors who prefer reduced motion see the still poster.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (reduced) v.pause();
    else v.play().catch(() => {});
  }, [reduced]);

  return (
    <video
      ref={ref}
      className="h-full w-full rounded-2xl object-cover"
      src="/videos/designed-in-rhino8.mp4"
      poster="/videos/designed-in-rhino8-poster.jpg"
      autoPlay={!reduced}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label="Footwear, jewelry, architecture, prosthetics, industrial parts and more being designed in Rhino 8"
    />
  );
}
