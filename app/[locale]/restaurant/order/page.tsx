import { listActiveMenu, menuImageUrl, type MenuSection } from "@/lib/menu-repo";
import OrderClient, { type OrderSection } from "./OrderClient";

export const revalidate = 60;

export const metadata = {
  title: "Order Online — Shehnai Resort",
  description:
    "Order from our kitchen for in-room dining, takeaway, or delivery within the resort radius.",
};

/** Server wrapper: fetch the live menu and resolve storage URLs once on the
 *  server. Unavailable items are kept (rendered as disabled) so guests can
 *  see what we serve even when a dish is temporarily off — matches the
 *  Phase 1 contract documented in lib/menu-repo.ts. */
function adapt(sections: MenuSection[]): OrderSection[] {
  return sections.map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    items: s.items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      priceSinglePaise: i.priceSinglePaise,
      priceHalfPaise: i.priceHalfPaise,
      priceFullPaise: i.priceFullPaise,
      note: i.note,
      isVeg: i.isVeg,
      imageUrl: menuImageUrl(i.imagePath),
      isAvailable: i.isAvailable,
    })),
  }));
}

export default async function OrderPage() {
  const sections = await listActiveMenu();
  return <OrderClient sections={adapt(sections)} />;
}
