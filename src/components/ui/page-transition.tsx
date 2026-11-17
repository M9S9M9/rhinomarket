"use client";

import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Pages used to fade out and back in on every navigation, which delayed each click
// and left pages blank until JavaScript loaded. Content now shows immediately.
export function PageTransition({ children }: PageTransitionProps) {
  return <>{children}</>;
}
