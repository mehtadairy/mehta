"use client";

import React from "react";

export function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!text) return null;
  if (!query || !query.trim()) return <span>{text}</span>;

  const cleanQuery = query.trim();
  const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === cleanQuery.toLowerCase() ? (
          <mark key={i} className="bg-amber-200 text-brand-charcoal font-extrabold px-0.5 rounded-xs">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
