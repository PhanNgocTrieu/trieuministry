"use client";

import { useTrackVisit } from "@/hooks/use-track-visit";

export default function VisitTracker() {
  useTrackVisit();
  return null;
}
