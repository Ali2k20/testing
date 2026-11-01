"use client";

import { usePathname } from "next/navigation";

/**
 * Wraps a page in the storefront chrome (header, footer, cart, WhatsApp button),
 * except on standalone tools like /safqa that bring their own full-screen UI.
 */
export function StoreChrome({
  before,
  after,
  children,
}: {
  before: React.ReactNode;
  after: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/safqa")) return <>{children}</>;
  return (
    <>
      {before}
      <main id="main">{children}</main>
      {after}
    </>
  );
}
