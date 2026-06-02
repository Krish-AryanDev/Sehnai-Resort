import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { getRestaurantSettings } from "@/lib/menu-repo";
import { SettingsForm, type SettingsFormValues } from "./_components/SettingsForm";
import "../admin.css";
import "./settings.css";

export const dynamic = "force-dynamic";

export default async function RestaurantSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();

  const { ok, error } = await searchParams;
  const settings = await getRestaurantSettings();

  // Map the repo shape (paise, nullable coords/times) onto the rupee-and-string
  // shape the form fields expect.
  const values: SettingsFormValues = {
    deliveryEnabled: settings.deliveryEnabled,
    deliveryRadiusKm: settings.deliveryRadiusKm,
    deliveryFeeRupees: settings.deliveryFeePaise / 100,
    minOrderRupees: settings.minOrderPaise / 100,
    restaurantLat: settings.restaurantLat == null ? "" : String(settings.restaurantLat),
    restaurantLng: settings.restaurantLng == null ? "" : String(settings.restaurantLng),
    kitchenOpenFrom: settings.kitchenOpenFrom ?? "",
    kitchenOpenTo: settings.kitchenOpenTo ?? "",
    gstPercent: settings.gstPercent,
  };

  return (
    <div>
      <Link href="/admin/orders" className="admin-back-link">
        <ArrowLeft size={14} />
        <span>Back to orders</span>
      </Link>

      <h1 className="admin-h1">Restaurant settings</h1>

      <p
        style={{
          color: "#78716c",
          fontSize: 13,
          maxWidth: "44rem",
          margin: "-0.5rem 0 1.25rem",
          lineHeight: 1.6,
        }}
      >
        Runtime config for the food-ordering system. These values drive the
        delivery-radius check and fee at checkout, the minimum order, the GST
        on the order summary, and the kitchen hours shown on the storefront.
      </p>

      {ok === "saved" && (
        <div className="admin-alert admin-alert--success">Settings saved.</div>
      )}
      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <SettingsForm values={values} />
    </div>
  );
}
