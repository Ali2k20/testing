import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderConfirmation } from "@/components/order-confirmation";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={null}>
      <OrderConfirmation />
    </Suspense>
  );
}
