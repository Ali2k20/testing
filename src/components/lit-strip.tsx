"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A sideways row of garments where the one nearest the centre is lit and the
 * rest sit in shadow. Frames are rendered on the server; this wrapper only
 * marks the centred frame, names it in the caption below, starts the row on
 * `startIndex`, and lets a mouse drag the row. Without script every frame
 * stays fully lit.
 */
export function LitStrip({
  children,
  label,
  captions,
  startIndex = 0,
}: {
  children: ReactNode;
  label: string;
  /** One caption per frame, in frame order. */
  captions: { name: string; detail: string }[];
  startIndex?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(startIndex);

  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    const frames = Array.from(row.querySelectorAll<HTMLElement>("[data-frame]"));
    if (frames.length === 0) return;

    const light = () => {
      const centre = row.scrollLeft + row.clientWidth / 2;
      let nearest = frames[0];
      for (const frame of frames) {
        const mid = frame.offsetLeft + frame.offsetWidth / 2;
        const best = nearest.offsetLeft + nearest.offsetWidth / 2;
        if (Math.abs(mid - centre) < Math.abs(best - centre)) nearest = frame;
      }
      for (const frame of frames) {
        if (frame === nearest) frame.setAttribute("data-lit", "");
        else frame.removeAttribute("data-lit");
      }
      setLit(frames.indexOf(nearest));
    };

    const start = frames[Math.min(startIndex, frames.length - 1)];
    row.scrollLeft = start.offsetLeft + start.offsetWidth / 2 - row.clientWidth / 2;
    light();
    row.setAttribute("data-ready", "");

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(light);
    };
    row.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // Mouse drag; touch and trackpads already scroll natively.
    let dragging = false;
    let moved = false;
    let originX = 0;
    let originScroll = 0;
    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      dragging = true;
      moved = false;
      originX = event.clientX;
      originScroll = row.scrollLeft;
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const delta = event.clientX - originX;
      if (Math.abs(delta) > 4) {
        moved = true;
        row.setAttribute("data-dragging", "");
      }
      row.scrollLeft = originScroll - delta;
    };
    const onUp = () => {
      dragging = false;
      row.removeAttribute("data-dragging");
    };
    // A drag must not also open the product it ended on.
    const onClick = (event: MouseEvent) => {
      if (moved) {
        event.preventDefault();
        event.stopPropagation();
        moved = false;
      }
    };
    row.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    row.addEventListener("click", onClick, true);

    return () => {
      cancelAnimationFrame(frame);
      row.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      row.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      row.removeEventListener("click", onClick, true);
    };
  }, [startIndex]);

  const caption = captions[lit];

  return (
    <div>
      <div ref={ref} className="lit-strip no-scrollbar" role="region" aria-label={label} tabIndex={0}>
        {children}
      </div>
      {caption && (
        <p className="mt-4 px-5 text-center text-[0.9375rem] text-fg" aria-live="polite">
          {caption.name}
          <span className="text-fg-muted"> · {caption.detail}</span>
        </p>
      )}
    </div>
  );
}
