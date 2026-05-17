import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { MenuCategoryRow, MenuItemRow } from "@/lib/menu-repo";

/**
 * Admin-side menu reads. Mirror of /lib/menu-repo.ts but:
 *   • Uses the service-role client (bypasses RLS), so we can see and edit
 *     inactive categories / unavailable items.
 *   • Throws on DB errors instead of swallowing them — admin pages should
 *     surface failures, not silently render an empty editor.
 *
 * All callers must already be running inside server actions or server
 * components gated by `requireAdmin()`.
 */

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

/** Every category — active and inactive — sorted by sort_order. */
export async function listAllCategoriesAdmin(): Promise<MenuCategoryRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("menu_categories")
    .select("id, title, subtitle, sort_order, image_path, is_active")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`menu-admin.listAllCategoriesAdmin: ${error.message}`);
  return (data as DbCategory[]).map(rowToCategory);
}

/** Every item — available and unavailable — sorted by (category, sort_order). */
export async function listAllItemsAdmin(): Promise<MenuItemRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, category_id, name, description, price_single, price_half, price_full, note, is_veg, image_path, is_available, sort_order")
    .order("category_id", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`menu-admin.listAllItemsAdmin: ${error.message}`);
  return (data as DbItem[]).map(rowToItem);
}

export async function getCategoryAdmin(id: string): Promise<MenuCategoryRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("menu_categories")
    .select("id, title, subtitle, sort_order, image_path, is_active")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`menu-admin.getCategoryAdmin: ${error.message}`);
  return data ? rowToCategory(data as DbCategory) : null;
}

export async function getItemAdmin(id: string): Promise<MenuItemRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, category_id, name, description, price_single, price_half, price_full, note, is_veg, image_path, is_available, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`menu-admin.getItemAdmin: ${error.message}`);
  return data ? rowToItem(data as DbItem) : null;
}
