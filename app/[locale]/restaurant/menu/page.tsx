import { listActiveMenu, type MenuSection } from "@/lib/menu-repo";
import type { MenuCategory } from "@/lib/menu-data";
import MenuClient from "./MenuClient";

export const revalidate = 60;

/**
 * Server wrapper for the existing parchment-styled menu page. Fetches the
 * live menu from Supabase via menu-repo (was hardcoded against
 * lib/menu-data.ts pre-Phase-2) and adapts the paise-denominated shape
 * back to the rupees shape MenuClient already renders, so we keep every
 * pixel of the existing design.
 *
 * Unavailable items are filtered out — the printed menu shouldn't list
 * dishes you can't order. The /restaurant/order storefront (Phase 3+)
 * will keep them visible but disabled.
 */
function adaptToLegacy(sections: MenuSection[]): MenuCategory[] {
  return sections.map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle ?? undefined,
    items: s.items
      .filter((i) => i.isAvailable)
      .map((i) => ({
        name: i.name,
        price: i.priceSinglePaise != null ? i.priceSinglePaise / 100 : undefined,
        priceHalf:
          i.priceHalfPaise != null ? i.priceHalfPaise / 100 : undefined,
        priceFull:
          i.priceFullPaise != null ? i.priceFullPaise / 100 : undefined,
        note: i.note ?? undefined,
        veg: i.isVeg,
      })),
  }));
}

export default async function MenuPage() {
  const sections = await listActiveMenu();
  const menuSections = adaptToLegacy(sections);
  return <MenuClient menuSections={menuSections} />;
}
