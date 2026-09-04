"use client";

import { useEffect, useState } from "react";
import { site, whatsappLink } from "@/lib/site";

/**
 * Floating WhatsApp entry point. In the UAE a large share of boutique orders
 * still start as a WhatsApp message, so this is a primary channel, not a nicety.
 */
export function WhatsAppButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <a
      href={whatsappLink(`Hi ${site.name}, I have a question about an abaya.`)}
      target="_blank"
      rel="noopener noreferrer"
      className={`wa-fab fixed bottom-5 right-5 z-40 flex items-center gap-2.5 bg-[#1F7A4D] px-4 py-3 text-ivory shadow-lg transition-all duration-500 hover:bg-[#186039] ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      aria-label="Chat with FRS on WhatsApp"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor">
        <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.2-1.36a9.9 9.9 0 0 0 4.84 1.24h.01c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04A9.88 9.88 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.1.81.83-3.02-.2-.31a8.24 8.24 0 0 1 12.8-10.2 8.18 8.18 0 0 1 2.42 5.84c0 4.55-3.7 8.21-8.25 8.21Zm4.52-6.15c-.25-.13-1.47-.72-1.69-.8-.23-.09-.39-.13-.56.12s-.64.8-.78.97c-.15.16-.29.18-.53.06a6.7 6.7 0 0 1-3.36-2.94c-.25-.44.25-.4.72-1.35.08-.16.04-.3-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03s.87 2.35.99 2.51c.13.16 1.72 2.62 4.16 3.68 1.55.67 2.15.72 2.93.61.47-.07 1.47-.6 1.68-1.19.2-.58.2-1.08.14-1.18-.06-.11-.22-.18-.47-.3Z" />
      </svg>
      <span className="eyebrow hidden sm:inline">WhatsApp us</span>
    </a>
  );
}
