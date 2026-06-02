"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

/**
 * Server action for the single-row restaurant config at
 * /admin/restaurant-settings. Mirrors the conventions in
 * /admin/menu/actions.ts:
 *   • requireAdmin() hard gate at the top.
 *   • Validation failures redirect back with ?error=… (preserved across the
 *     PRG round-trip).
 *   • A successful write revalidates every storefront route that reads
 *     settings so a radius / fee / GST change takes effect immediately.
 *
 * The settings row is the singleton enforced by `id = 1 check (id = 1)` in
 * db/migrations/0009_restaurant_settings.sql — we always update that row;
 * we never insert (the migration seeds it).
 *
 * Money fields arrive as RUPEES (admins think in rupees) and persist as
 * paise, matching delivery_fee_paise / min_order_paise.
 */

const SETTINGS_PATH = "/admin/restaurant-settings";

function str(fd: FormData, key: string): string {
  return (fd.get(key) ?? "").toString();
}

function failTo(msg: string): never {
  redirect(`${SETTINGS_PATH}?error=${encodeURIComponent(msg)}`);
}

/** Rupees → paise. Empty is rejected here (callers pass required fields). */
function rupeesToPaise(raw: string, field: string): number {
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < 0) {
    failTo(`${field} must be a non-negative number.`);
  }
  return Math.round(n * 100);
}

/** Parse a bounded decimal (radius, GST). */
function decimalInRange(raw: string, field: string, min: number, max: number): number {
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < min || n > max) {
    failTo(`${field} must be between ${min} and ${max}.`);
  }
  return n;
}

/** Optional latitude/longitude. Blank → null; otherwise bounds-checked. */
function optCoord(raw: string, field: string, bound: number): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < -bound || n > bound) {
    failTo(`${field} must be between -${bound} and ${bound}, or left blank.`);
  }
  return n;
}

/** Optional "HH:MM" 24h time. Blank → null; otherwise validated. */
function optTime(raw: string, field: string): string | null {
  const t = raw.trim();
  if (t === "") return null;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) {
    failTo(`${field} must be a 24-hour time like 09:00, or left blank.`);
  }
  return t;
}

export async function updateRestaurantSettings(formData: FormData): Promise<never> {
  await requireAdmin();

  const deliveryEnabled = str(formData, "deliveryEnabled") === "1";
  const deliveryRadiusKm = decimalInRange(str(formData, "deliveryRadiusKm"), "Delivery radius", 0, 100);
  const deliveryFeePaise = rupeesToPaise(str(formData, "deliveryFee"), "Delivery fee");
  const minOrderPaise = rupeesToPaise(str(formData, "minOrder"), "Minimum order");
  const restaurantLat = optCoord(str(formData, "restaurantLat"), "Latitude", 90);
  const restaurantLng = optCoord(str(formData, "restaurantLng"), "Longitude", 180);
  const kitchenOpenFrom = optTime(str(formData, "kitchenOpenFrom"), "Opening time");
  const kitchenOpenTo = optTime(str(formData, "kitchenOpenTo"), "Closing time");
  const gstPercent = decimalInRange(str(formData, "gstPercent"), "GST percent", 0, 100);

  // Geocoordinates come as a pair — one without the other can't position the
  // restaurant for radius checks, so reject a half-filled pair early.
  if ((restaurantLat === null) !== (restaurantLng === null)) {
    failTo("Set both latitude and longitude, or leave both blank.");
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("restaurant_settings")
    .update({
      delivery_enabled: deliveryEnabled,
      delivery_radius_km: deliveryRadiusKm,
      delivery_fee_paise: deliveryFeePaise,
      min_order_paise: minOrderPaise,
      restaurant_lat: restaurantLat,
      restaurant_lng: restaurantLng,
      kitchen_open_from: kitchenOpenFrom,
      kitchen_open_to: kitchenOpenTo,
      gst_percent: gstPercent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) failTo(`Save failed: ${error.message}`);

  // Settings drive delivery-radius enforcement, the delivery fee, the minimum
  // order, and GST on the order summary — bust every storefront route that
  // reads them, plus this page.
  revalidatePath("/[locale]/restaurant/order", "page");
  revalidatePath("/[locale]/restaurant/order/checkout", "page");
  revalidatePath(SETTINGS_PATH);

  redirect(`${SETTINGS_PATH}?ok=saved`);
}
