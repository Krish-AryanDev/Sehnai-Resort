/**
 * Great-circle distance + delivery-radius helper.
 *
 * Pure function, no external API — we don't need geocoding precision and a
 * direct call to Google Maps would cost money on every checkout attempt.
 * Haversine on the WGS-84 mean radius is good to ~0.5% over the distances
 * we care about (a few km within a town), which is well below the typical
 * radius the kitchen would set.
 */

const EARTH_RADIUS_KM = 6371.0088;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type RadiusCheck =
  | { kind: "inside"; km: number }
  | { kind: "outside"; km: number; limitKm: number }
  /** Either the restaurant or the user coordinates are missing — caller
   *  should allow the order through and let admin sort it out. We don't
   *  block on incomplete data because a guest entering only a street name
   *  is a legitimate flow. */
  | { kind: "unknown" };

export function checkDeliveryRadius(args: {
  customerLat: number | null;
  customerLng: number | null;
  restaurantLat: number | null;
  restaurantLng: number | null;
  radiusKm: number;
}): RadiusCheck {
  if (
    args.customerLat == null ||
    args.customerLng == null ||
    args.restaurantLat == null ||
    args.restaurantLng == null
  ) {
    return { kind: "unknown" };
  }
  const km = haversineKm(
    { lat: args.customerLat, lng: args.customerLng },
    { lat: args.restaurantLat, lng: args.restaurantLng }
  );
  if (km <= args.radiusKm) return { kind: "inside", km };
  return { kind: "outside", km, limitKm: args.radiusKm };
}
