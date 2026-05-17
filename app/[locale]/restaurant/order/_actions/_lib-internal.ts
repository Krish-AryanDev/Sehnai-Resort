import "server-only";
import { getMenuItemsByIds, type MenuItemRow } from "@/lib/menu-repo";
import type { CartLineInput } from "@/lib/order-mutations";

/**
 * Compute GST server-side without touching `createOrder`.
 *
 * Lives here (not in order-mutations) on purpose: keeping the tax math
 * outside the write path means createOrder stays the single source of
 * pricing truth and isn't tempted to second-guess itself. The cost is a
 * second round-trip to menu_items at checkout — fine; cart sizes are tiny.
 */
export async function computeServerSideTax(
  cart: CartLineInput[],
  gstPercent: number
): Promise<number> {
  if (gstPercent <= 0 || cart.length === 0) return 0;

  const ids = Array.from(new Set(cart.map((l) => l.menuItemId)));
  const byId = await getMenuItemsByIds(ids);

  let subtotal = 0;
  for (const line of cart) {
    const item = byId.get(line.menuItemId);
    if (!item) continue; // skip; createOrder will reject the whole order
    const unit = unitPriceFor(item, line.variant);
    if (unit == null) continue;
    subtotal += unit * line.qty;
  }
  return Math.round((subtotal * gstPercent) / 100);
}

function unitPriceFor(
  item: MenuItemRow,
  variant: CartLineInput["variant"]
): number | null {
  if (variant === "single") return item.priceSinglePaise;
  if (variant === "half") return item.priceHalfPaise;
  return item.priceFullPaise;
}
