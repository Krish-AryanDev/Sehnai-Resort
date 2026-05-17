import { getRestaurantSettings } from "@/lib/menu-repo";
import { CheckoutClient } from "./CheckoutClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout — Shehnai Resort",
};

export default async function CheckoutPage() {
  const settings = await getRestaurantSettings();
  return (
    <CheckoutClient
      settings={{
        deliveryEnabled: settings.deliveryEnabled,
        deliveryRadiusKm: settings.deliveryRadiusKm,
        deliveryFeePaise: settings.deliveryFeePaise,
        restaurantLat: settings.restaurantLat,
        restaurantLng: settings.restaurantLng,
        gstPercent: settings.gstPercent,
      }}
    />
  );
}
