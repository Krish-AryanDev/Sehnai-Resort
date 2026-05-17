import "server-only";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";

/**
 * Server-only read layer for the restaurant ordering system. Replaces the
 * hardcoded /lib/menu-data.ts as the runtime source of truth (the TS file
 * stays in the repo as the seed input — see db/migrations/0010_seed_menu.sql).
 *
 * Pattern mirrors /lib/bookings-db.ts:
 *   • Anon-key client (server.ts), public RLS lets us read with no auth.
 *   • Graceful degradation: env not set or DB call fails → empty payload
 *     and a warn-once log, so a misconfigured Supabase never 500s the
 *     public storefront. The page renders an empty menu instead.
 */

/* ============================================================
 * Public types — kept paise-denominated to match payment-provider.ts.
 * The UI layer formats to rupees at the edge.
 * ============================================================ */

export type MenuCategoryRow = {
  id: string;             // slug, e.g. "tandoor"
  title: string;
  subtitle: string | null;
  sortOrder: number;
  imagePath: string | null;
  isActive: boolean;
};

export type MenuItemRow = {
  id: string;             // uuid
  categoryId: string;
  name: string;
  description: string | null;
  priceSinglePaise: number | null;
  priceHalfPaise: number | null;
  priceFullPaise: number | null;
  note: string | null;
  isVeg: boolean;
  imagePath: string | null;
  isAvailable: boolean;
  sortOrder: number;
};

/** Convenience shape for the storefront — one query, items grouped under
 *  their category. Categories are pre-sorted by sortOrder; items inside
 *  each category are pre-sorted by sortOrder. */
export type MenuSection = MenuCategoryRow & {
  items: MenuItemRow[];
};

export type RestaurantSettings = {
  deliveryEnabled: boolean;
  deliveryRadiusKm: number;
  deliveryFeePaise: number;
  minOrderPaise: number;
  restaurantLat: number | null;
  restaurantLng: number | null;
  kitchenOpenFrom: string | null;     // "HH:MM" 24h local, or null = always
  kitchenOpenTo: string | null;
  gstPercent: number;
};

/* ============================================================
 * Warn-once helpers (same pattern as bookings-db.ts so prod logs surface
 * a single misconfig line per process instead of one per request).
 * ============================================================ */

let warnedAboutEnv = false;
function warnOnceMissingEnv() {
  if (warnedAboutEnv) return;
  warnedAboutEnv = true;
  // eslint-disable-next-line no-console
  console.warn(
    "[menu-repo] Supabase env not set — returning empty menu. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
  );
}

let warnedAboutDb = false;
function warnOnceDb(where: string, message: string) {
  if (warnedAboutDb) return;
  warnedAboutDb = true;
  // eslint-disable-next-line no-console
  console.warn(
    `[menu-repo] ${where} failed (${message}) — returning empty payload. ` +
      "Verify db/migrations/0005-0010 ran in Supabase Studio and RLS allows " +
      "anon select on menu_categories / menu_items / restaurant_settings."
  );
}

/* ============================================================
 * Row mappers
 * ============================================================ */

type DbCategory = {
  id: string;
  title: string;
  subtitle: string | null;
  sort_order: number;
  image_path: string | null;
  is_active: boolean;
};

type DbItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_single: number | null;
  price_half: number | null;
  price_full: number | null;
  note: string | null;
  is_veg: boolean;
  image_path: string | null;
  is_available: boolean;
  sort_order: number;
};

type DbSettings = {
  delivery_enabled: boolean;
  delivery_radius_km: number | string;   // numeric → string from PG
  delivery_fee_paise: number;
  min_order_paise: number;
  restaurant_lat: number | null;
  restaurant_lng: number | null;
  kitchen_open_from: string | null;
  kitchen_open_to: string | null;
  gst_percent: number | string;
};

function rowToCategory(r: DbCategory): MenuCategoryRow {
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    sortOrder: r.sort_order,
    imagePath: r.image_path,
    isActive: r.is_active,
  };
}

function rowToItem(r: DbItem): MenuItemRow {
  return {
    id: r.id,
    categoryId: r.category_id,
    name: r.name,
    description: r.description,
    priceSinglePaise: r.price_single,
    priceHalfPaise: r.price_half,
    priceFullPaise: r.price_full,
    note: r.note,
    isVeg: r.is_veg,
    imagePath: r.image_path,
    isAvailable: r.is_available,
    sortOrder: r.sort_order,
  };
}

function rowToSettings(r: DbSettings): RestaurantSettings {
  return {
    deliveryEnabled: r.delivery_enabled,
    deliveryRadiusKm: Number(r.delivery_radius_km),
    deliveryFeePaise: r.delivery_fee_paise,
    minOrderPaise: r.min_order_paise,
    restaurantLat: r.restaurant_lat,
    restaurantLng: r.restaurant_lng,
    kitchenOpenFrom: r.kitchen_open_from,
    kitchenOpenTo: r.kitchen_open_to,
    gstPercent: Number(r.gst_percent),
  };
}

/* ============================================================
 * Public fetchers
 * ============================================================ */

/**
 * Storefront query: returns active categories with their items, both pre-
 * sorted by sort_order. Unavailable items are INCLUDED (with isAvailable
 * = false) so the UI can render them as disabled rather than hiding them.
 */
export async function listActiveMenu(): Promise<MenuSection[]> {
  if (!isSupabaseConfigured()) {
    warnOnceMissingEnv();
    return [];
  }

  const supabase = getSupabaseServerClient();

  // Two parallel queries — simpler than a single nested select and works
  // identically against RLS. Categories are tiny (~15 rows); items are
  // bounded (a few hundred). No pagination needed.
  const [catsRes, itemsRes] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, title, subtitle, sort_order, image_path, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select("id, category_id, name, description, price_single, price_half, price_full, note, is_veg, image_path, is_available, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  if (catsRes.error) {
    warnOnceDb("listActiveMenu(categories)", catsRes.error.message);
    return [];
  }
  if (itemsRes.error) {
    warnOnceDb("listActiveMenu(items)", itemsRes.error.message);
    return [];
  }

  const categories = (catsRes.data as DbCategory[]).map(rowToCategory);
  const items = (itemsRes.data as DbItem[]).map(rowToItem);

  // Bucket items by category in one pass.
  const itemsByCategory = new Map<string, MenuItemRow[]>();
  for (const item of items) {
    const bucket = itemsByCategory.get(item.categoryId);
    if (bucket) bucket.push(item);
    else itemsByCategory.set(item.categoryId, [item]);
  }

  return categories.map((c) => ({
    ...c,
    items: itemsByCategory.get(c.id) ?? [],
  }));
}

/** Single item lookup — used by the order create path to re-validate the
 *  cart against authoritative server-side prices (never trust the client). */
export async function getMenuItem(id: string): Promise<MenuItemRow | null> {
  if (!isSupabaseConfigured()) {
    warnOnceMissingEnv();
    return null;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, category_id, name, description, price_single, price_half, price_full, note, is_veg, image_path, is_available, sort_order")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    warnOnceDb(`getMenuItem(${id})`, error.message);
    return null;
  }
  return data ? rowToItem(data as DbItem) : null;
}

/** Bulk lookup variant — single round-trip when re-validating a whole cart. */
export async function getMenuItemsByIds(
  ids: string[]
): Promise<Map<string, MenuItemRow>> {
  const out = new Map<string, MenuItemRow>();
  if (ids.length === 0 || !isSupabaseConfigured()) {
    if (!isSupabaseConfigured()) warnOnceMissingEnv();
    return out;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, category_id, name, description, price_single, price_half, price_full, note, is_veg, image_path, is_available, sort_order")
    .in("id", ids);

  if (error) {
    warnOnceDb("getMenuItemsByIds", error.message);
    return out;
  }

  for (const row of (data as DbItem[]) ?? []) {
    const mapped = rowToItem(row);
    out.set(mapped.id, mapped);
  }
  return out;
}

/** Single-row settings. Falls back to safe defaults if the row is missing
 *  or env is unset, so the storefront still boots. */
export async function getRestaurantSettings(): Promise<RestaurantSettings> {
  const fallback: RestaurantSettings = {
    deliveryEnabled: true,
    deliveryRadiusKm: 5,
    deliveryFeePaise: 0,
    minOrderPaise: 0,
    restaurantLat: null,
    restaurantLng: null,
    kitchenOpenFrom: null,
    kitchenOpenTo: null,
    gstPercent: 5,
  };

  if (!isSupabaseConfigured()) {
    warnOnceMissingEnv();
    return fallback;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select("delivery_enabled, delivery_radius_km, delivery_fee_paise, min_order_paise, restaurant_lat, restaurant_lng, kitchen_open_from, kitchen_open_to, gst_percent")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    warnOnceDb("getRestaurantSettings", error.message);
    return fallback;
  }
  return data ? rowToSettings(data as DbSettings) : fallback;
}

/* ============================================================
 * Storage URL helper
 * ============================================================ */

/**
 * Resolve a storage path stored in `image_path` to a public URL. Returns
 * null when the input is null/empty so callers can fall back to a category
 * placeholder. Uses the public bucket convention from the plan
 * (menu-images).
 */
export function menuImageUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/menu-images/${path}`;
}
