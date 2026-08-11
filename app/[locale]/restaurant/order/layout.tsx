import { CartProvider } from "@/lib/cart-store";
import { redirect } from "@/i18n/navigation";

/**
 * Wraps every page under /restaurant/order in the cart provider so the
 * cart's localStorage-backed state survives navigation between the
 * storefront, the checkout, and the order tracking page. Without this
 * lift, navigating from /order → /order/checkout would mount a fresh
 * provider tree and the cart would briefly appear empty mid-checkout.
 */
export default function OrderRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  redirect({ href: "/restaurant", locale: "en" });
  return <CartProvider>{children}</CartProvider>;
}
