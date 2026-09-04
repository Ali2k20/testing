"use client";

import { useStore } from "@/lib/store";

export function WishlistButton({
  slug,
  className = "",
  withLabel = false,
}: {
  slug: string;
  className?: string;
  withLabel?: boolean;
}) {
  const { inWishlist, toggleWishlist, ready } = useStore();
  const saved = ready && inWishlist(slug);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleWishlist(slug);
      }}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={`inline-flex items-center gap-2 transition-colors ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        fill={saved ? "#A8834F" : "none"}
        stroke={saved ? "#A8834F" : "currentColor"}
        strokeWidth="1.4"
      >
        <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
      </svg>
      {withLabel && <span className="eyebrow">{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
