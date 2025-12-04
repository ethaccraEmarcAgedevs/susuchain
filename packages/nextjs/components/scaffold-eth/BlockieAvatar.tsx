"use client";

import { blo } from "blo";

// Custom Blockie Avatar Component
export const BlockieAvatar = ({
  address,
  ensImage,
  size,
}: {
  address: string;
  ensImage?: string | null;
  size?: number;
}) => (
  // Don't want to use nextJS Image here (and adding remote patterns for the URL)
  // eslint-disable-next-line @next/next/no-img-element
  <img
    className="rounded-full"
    src={ensImage || blo(address as `0x${string}`)}
    width={size || 24}
    height={size || 24}
    alt={`${address} avatar`}
  />
);
