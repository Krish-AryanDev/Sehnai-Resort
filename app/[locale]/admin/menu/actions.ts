"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

/**
 * Server actions for the admin menu editor at /admin/menu.
 *
 * Patterns lifted from /admin/bookings/new/actions.ts:
 *   • requireAdmin() at the top — hard auth gate, redirects to /login if not.
 *   • Validation failures redirect back to the edit form with ?error=…
 *   • Successful writes revalidate both the admin list AND the public
 *     storefront routes so price/availability edits show up immediately.
 *
 * All money values arrive from the form as RUPEES (the input fields show
 * rupees because admins think in rupees) and get persisted as paise.
 *
 * Image uploads use the `menu-images` public bucket created in Phase 1.
 * The path convention is `{itemId}.{ext}` so re-uploading replaces the
 * file; we then store the path string on menu_items.image_path.
 */

/* ============================================================
 * Form helpers
 * ============================================================ */

function str(fd: FormData, key: string): string {
  return (fd.get(key) ?? "").toString();
}
function trimOrNull(s: string): string | null {
  const v = s.trim();
  return v.length === 0 ? null : v;
}

/** Parse a rupees field. Empty → null, otherwise a non-negative integer
 *  number of paise. Throws via the redirect helper if non-numeric. */
function rupeesToPaiseOrNull(
  raw: string,
  fieldName: string,
  fail: (msg: string) => never
): number | null {
  const t = raw.trim();
  if (t === "") return null;
  // Allow decimals (e.g. 199.50) — multiply, then round to nearest paise.
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) {
    fail(`${fieldName} must be a non-negative number.`);
  }
  return Math.round(n * 100);
}

function parseIntOr(raw: string, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function failTo(path: string, msg: string): never {
  const url = `${path}?error=${encodeURIComponent(msg)}`;
  redirect(url);
}

/* ============================================================
 * Revalidate everywhere a menu change is user-visible.
 * ============================================================ */
function bustMenuCaches() {
  // Public storefront pages (Phase 3 will use these too).
  revalidatePath("/[locale]/restaurant", "page");
  revalidatePath("/[locale]/restaurant/menu", "page");
  revalidatePath("/[locale]/restaurant/order", "page");
  // Admin lists.
  revalidatePath("/admin/menu");
}

/* ============================================================
 * Items
 * ============================================================ */

/** Create a new menu item. */
export async function createMenuItem(formData: FormData): Promise<never> {
  await requireAdmin();

  const categoryId = str(formData, "categoryId");
  const name = str(formData, "name").trim();
  const description = trimOrNull(str(formData, "description"));
  const note = trimOrNull(str(formData, "note"));
  const isVeg = str(formData, "isVeg") === "1";
  const isAvailable = str(formData, "isAvailable") === "1";
  const sortOrder = parseIntOr(str(formData, "sortOrder"), 1000);

  const fail = (msg: string): never =>
    failTo(
      `/admin/menu/items/new?${new URLSearchParams({
        categoryId,
        name,
        description: description ?? "",
        note: note ?? "",
        sortOrder: String(sortOrder),
      }).toString()}`,
      msg
    );

  if (!categoryId) fail("Pick a category.");
  if (!name) fail("Name is required.");

  const priceSingle = rupeesToPaiseOrNull(str(formData, "priceSingle"), "Single price", fail);
  const priceHalf = rupeesToPaiseOrNull(str(formData, "priceHalf"), "Half price", fail);
  const priceFull = rupeesToPaiseOrNull(str(formData, "priceFull"), "Full price", fail);

  if (priceSingle == null && priceHalf == null && priceFull == null) {
    fail("Set at least one price (single, half, or full).");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      category_id: categoryId,
      name,
      description,
      note,
      is_veg: isVeg,
      is_available: isAvailable,
      sort_order: sortOrder,
      price_single: priceSingle,
      price_half: priceHalf,
      price_full: priceFull,
    })
    .select("id")
    .single();

  if (error || !data) {
    // Surface DB error (e.g. unique constraint on (category_id, name)).
    const msg = error?.message.includes("menu_items_category_name_key")
      ? `"${name}" already exists in this category.`
      : `Insert failed: ${error?.message ?? "unknown"}`;
    fail(msg);
  }

  bustMenuCaches();
  // Non-null: `fail()` above returns `never`, so we only reach here with a row.
  redirect(`/admin/menu/items/${data!.id}?ok=created`);
}

/** Update an existing item. */
export async function updateMenuItem(formData: FormData): Promise<never> {
  await requireAdmin();

  const id = str(formData, "id");
  if (!id) failTo("/admin/menu", "Missing item id.");

  const categoryId = str(formData, "categoryId");
  const name = str(formData, "name").trim();
  const description = trimOrNull(str(formData, "description"));
  const note = trimOrNull(str(formData, "note"));
  const isVeg = str(formData, "isVeg") === "1";
  const isAvailable = str(formData, "isAvailable") === "1";
  const sortOrder = parseIntOr(str(formData, "sortOrder"), 1000);

  const fail = (msg: string): never => failTo(`/admin/menu/items/${id}`, msg);

  if (!categoryId) fail("Pick a category.");
  if (!name) fail("Name is required.");

  const priceSingle = rupeesToPaiseOrNull(str(formData, "priceSingle"), "Single price", fail);
  const priceHalf = rupeesToPaiseOrNull(str(formData, "priceHalf"), "Half price", fail);
  const priceFull = rupeesToPaiseOrNull(str(formData, "priceFull"), "Full price", fail);

  if (priceSingle == null && priceHalf == null && priceFull == null) {
    fail("Set at least one price (single, half, or full).");
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("menu_items")
    .update({
      category_id: categoryId,
      name,
      description,
      note,
      is_veg: isVeg,
      is_available: isAvailable,
      sort_order: sortOrder,
      price_single: priceSingle,
      price_half: priceHalf,
      price_full: priceFull,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    const msg = error.message.includes("menu_items_category_name_key")
      ? `"${name}" already exists in this category.`
      : `Update failed: ${error.message}`;
    fail(msg);
  }

  bustMenuCaches();
  redirect(`/admin/menu/items/${id}?ok=updated`);
}

/** Soft-action: flip the availability flag without leaving the list page.
 *  Used by the quick toggle on /admin/menu. */
export async function toggleItemAvailability(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = str(formData, "id");
  const next = str(formData, "next") === "1"; // target state

  if (!id) return;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("menu_items")
    .update({
      is_available: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    // Toggle errors are rare; log and move on so the form doesn't redirect
    // mid-list. The next render will show the actual state from the DB.
    // eslint-disable-next-line no-console
    console.error("[admin/menu] toggleItemAvailability failed:", error.message);
  }

  bustMenuCaches();
}

export async function deleteMenuItem(formData: FormData): Promise<never> {
  await requireAdmin();

  const id = str(formData, "id");
  if (!id) failTo("/admin/menu", "Missing item id.");

  const supabase = getSupabaseAdminClient();

  // Best-effort: also remove the image file, if any. Storage errors are
  // non-fatal; the row deletion is what matters.
  const { data: existing } = await supabase
    .from("menu_items")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  if (existing?.image_path) {
    await supabase.storage
      .from("menu-images")
      .remove([existing.image_path]);
  }

  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", id);

  if (error) failTo(`/admin/menu/items/${id}`, `Delete failed: ${error.message}`);

  bustMenuCaches();
  redirect("/admin/menu?ok=deleted");
}

/* ============================================================
 * Image upload — replaces the file at menu-images/{itemId}.{ext}
 * and writes the new path back to menu_items.image_path.
 *
 * Called from <ItemImageUploader /> on the edit page. Storage in the
 * `menu-images` public bucket (created manually in Phase 1).
 * ============================================================ */

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB

export async function uploadItemImage(formData: FormData): Promise<never> {
  await requireAdmin();

  const id = str(formData, "id");
  if (!id) failTo("/admin/menu", "Missing item id.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    failTo(`/admin/menu/items/${id}`, "Choose an image to upload.");
  }
  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    failTo(
      `/admin/menu/items/${id}`,
      `Image type ${file.type || "unknown"} not allowed. Use JPEG, PNG or WebP.`
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    failTo(
      `/admin/menu/items/${id}`,
      `Image too large (${Math.round(file.size / 1024)} KB). Max 4 MB.`
    );
  }

  // Pick extension from MIME so a renamed file (e.g. .heic uploaded as
  // image/jpeg) still lands with a sensible extension.
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
      ? "webp"
      : "jpg";
  const path = `${id}.${ext}`;

  const supabase = getSupabaseAdminClient();

  // upsert: true so re-uploading replaces the existing file.
  const { error: upErr } = await supabase.storage
    .from("menu-images")
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });
  if (upErr) {
    failTo(`/admin/menu/items/${id}`, `Upload failed: ${upErr.message}`);
  }

  // If the previous image had a different extension, clean it up. Otherwise
  // we'd leave a stale file in the bucket forever.
  const { data: row } = await supabase
    .from("menu_items")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();
  if (row?.image_path && row.image_path !== path) {
    await supabase.storage.from("menu-images").remove([row.image_path]);
  }

  const { error: rowErr } = await supabase
    .from("menu_items")
    .update({ image_path: path, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (rowErr) {
    failTo(`/admin/menu/items/${id}`, `Couldn't link image: ${rowErr.message}`);
  }

  bustMenuCaches();
  redirect(`/admin/menu/items/${id}?ok=image-uploaded`);
}

export async function removeItemImage(formData: FormData): Promise<never> {
  await requireAdmin();

  const id = str(formData, "id");
  if (!id) failTo("/admin/menu", "Missing item id.");

  const supabase = getSupabaseAdminClient();
  const { data: row } = await supabase
    .from("menu_items")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  if (row?.image_path) {
    await supabase.storage.from("menu-images").remove([row.image_path]);
  }

  const { error } = await supabase
    .from("menu_items")
    .update({ image_path: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) failTo(`/admin/menu/items/${id}`, `Couldn't remove image: ${error.message}`);

  bustMenuCaches();
  redirect(`/admin/menu/items/${id}?ok=image-removed`);
}

/* ============================================================
 * Categories
 * ============================================================ */

export async function createMenuCategory(formData: FormData): Promise<never> {
  await requireAdmin();

  const id = str(formData, "id").trim().toLowerCase();
  const title = str(formData, "title").trim();
  const subtitle = trimOrNull(str(formData, "subtitle"));
  const sortOrder = parseIntOr(str(formData, "sortOrder"), 9000);
  const isActive = str(formData, "isActive") === "1";

  const fail = (msg: string): never =>
    failTo(
      `/admin/menu/categories/new?${new URLSearchParams({
        id,
        title,
        subtitle: subtitle ?? "",
        sortOrder: String(sortOrder),
      }).toString()}`,
      msg
    );

  if (!id) fail("Slug is required.");
  if (!/^[a-z0-9-]+$/.test(id)) {
    fail("Slug can only contain lowercase letters, digits, and hyphens.");
  }
  if (!title) fail("Title is required.");

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("menu_categories").insert({
    id,
    title,
    subtitle,
    sort_order: sortOrder,
    is_active: isActive,
  });

  if (error) {
    const msg = error.message.includes("menu_categories_pkey")
      ? `Slug "${id}" already exists. Pick a different one.`
      : `Insert failed: ${error.message}`;
    fail(msg);
  }

  bustMenuCaches();
  redirect(`/admin/menu/categories/${id}?ok=created`);
}

export async function updateMenuCategory(formData: FormData): Promise<never> {
  await requireAdmin();

  const id = str(formData, "id");
  if (!id) failTo("/admin/menu", "Missing category id.");

  const title = str(formData, "title").trim();
  const subtitle = trimOrNull(str(formData, "subtitle"));
  const sortOrder = parseIntOr(str(formData, "sortOrder"), 9000);
  const isActive = str(formData, "isActive") === "1";

  const fail = (msg: string): never => failTo(`/admin/menu/categories/${id}`, msg);

  if (!title) fail("Title is required.");

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("menu_categories")
    .update({
      title,
      subtitle,
      sort_order: sortOrder,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) fail(`Update failed: ${error.message}`);

  bustMenuCaches();
  redirect(`/admin/menu/categories/${id}?ok=updated`);
}
