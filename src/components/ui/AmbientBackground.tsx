"use client";

import React from "react";

interface AmbientBackgroundProps {
  variant?: "hero" | "section" | "subtle";
  className?: string;
}

export default function AmbientBackground({ variant = "hero", className = "" }: AmbientBackgroundProps) {
  const intensity = variant === "hero" ? "opacity-100" : variant === "section" ? "opacity-70" : "opacity-40";

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${intensity} ${className}`} aria-hidden>
      <div className="orb orb-blue w-[500px] h-[500px] -top-32 -left-32 animate-float-3d" />
      <div className="orb orb-indigo w-[400px] h-[400px] top-1/4 -right-24 animate-pulse-slow" style={{ animationDelay: "1s" }} />
      <div className="orb orb-teal w-[350px] h-[350px] bottom-0 left-1/3 animate-float-3d" style={{ animationDelay: "2s" }} />
      <div className="orb orb-cyan w-[300px] h-[300px] bottom-1/4 right-1/4 animate-pulse-slow" style={{ animationDelay: "3s" }} />

      {variant === "hero" && (
        <>
          <div
            className="absolute top-[15%] left-[20%] w-3 h-3 rounded-full bg-blue-500/60 animate-orbit"
            style={{ animationDuration: "25s" }}
          />
          <div
            className="absolute top-[40%] right-[25%] w-2 h-2 rounded-full bg-cyan-400/50 animate-orbit"
            style={{ animationDuration: "18s", animationDirection: "reverse" }}
          />
          <div
            className="absolute bottom-[30%] left-[40%] w-2.5 h-2.5 rounded-full bg-teal-400/50 animate-orbit"
            style={{ animationDuration: "22s" }}
          />
        </>
      )}

      <div
        className="absolute inset-0 animate-aurora"
        style={{
          background: "var(--gradient-mesh)",
          opacity: 0.5,
        }}
      />
    </div>
  );
}
