/**
 * Shehnai Resort — Hotel Room Data
 *
 * Single source of truth for the 3 room categories, the 5 variants nested
 * underneath, and the 12 physical rooms tagged by variant.
 *
 * Hierarchy:
 *   RoomCategory  (e.g. "Standard Room")
 *     └── RoomVariant   (e.g. "Standard AC")
 *           └── IndividualRoom   (e.g. room-101)
 *
 * Availability is tracked at the *individual room* level via `roomBookings`.
 * The booking flow never asks the guest to pick a specific room number —
 * it just calls `findAvailableRoomForVariant(variantId, checkIn, checkOut)`
 * and assigns one. If no room in the variant is free, the variant card
 * is shown as "Sold out for these dates" and disabled.
 *
 * The admin panel (future) will append rows to `roomBookings`; no schema
 * changes will be needed.
 */

export type RoomVariant = {
  id: string;
  name: string;
  pricePerNight: number;
  sizeSqFt: number;
  bedType: string;
  maxGuests: number;
  shortPitch: string;
  features: string[];
  images: string[];
  roomCount: number;
};

export type RoomCategory = {
  id: "standard" | "deluxe" | "suite";
  name: string;
  tagline: string;
  heroImage: string;
  galleryImages: string[];
  description: string;
  highlights: string[];
  amenities: string[];
  variants: RoomVariant[];
  highlight?: boolean;
};

export type IndividualRoom = {
  id: string;
  roomNumber: string;
  variantId: string;
  floor?: number;
  view?: string;
};

/**
 * A blocked date range for a specific physical room. The admin owns this
 * list. A room is considered booked on a calendar day `d` if any record
 * satisfies `record.roomId === room.id && record.checkIn <= d < record.checkOut`
 * (half-open interval — checkout day is free to be re-booked).
 */
export type RoomBooking = {
  id: string;
  roomId: string;
  checkIn: string;   // ISO date "YYYY-MM-DD"
  checkOut: string;  // ISO date "YYYY-MM-DD"
  source?: "admin" | "online";
};

/* ----------------------------------------------------------------------
   Shared image placeholders — to be replaced when the client uploads
   real photography for each variant.
   ---------------------------------------------------------------------- */
const PLACEHOLDER_STANDARD = "/images/room-image.jpeg";
const PLACEHOLDER_DELUXE = "/images/room-image.jpeg";
const PLACEHOLDER_SUITE = "/images/room-image.jpeg";

export const roomCategories: RoomCategory[] = [
  {
    id: "standard",
    name: "Standard Room",
    tagline: "Where Comfort Meets Calm",
    heroImage: PLACEHOLDER_STANDARD,
    galleryImages: [
      PLACEHOLDER_STANDARD,
      PLACEHOLDER_STANDARD,
      PLACEHOLDER_STANDARD,
      PLACEHOLDER_STANDARD,
    ],
    description:
      "Elegantly appointed rooms with all the essentials for a restful stay — plush bedding, warm lighting, and modern finishes. Choose between our air-conditioned variant for year-round comfort or the value-friendly non-AC option for cooler months.",
    highlights: ["Queen Bed", "280 sq ft", "2 Guests", "Free Wi-Fi"],
    amenities: [
      "Free High-Speed Wi-Fi",
      "Smart TV",
      "Work Desk",
      "En-suite Bathroom",
      "Daily Housekeeping",
      "Room Service",
      "24/7 Reception",
      "Complimentary Toiletries",
    ],
    variants: [
      {
        id: "standard-ac",
        name: "Standard AC",
        pricePerNight: 1499,
        sizeSqFt: 280,
        bedType: "Queen Bed",
        maxGuests: 2,
        shortPitch: "Climate-controlled comfort for warm summer nights.",
        features: ["Air Conditioning", "Queen Bed", "Smart TV", "Work Desk"],
        images: [PLACEHOLDER_STANDARD],
        roomCount: 1,
      },
      {
        id: "standard-non-ac",
        name: "Standard Non-AC",
        pricePerNight: 1399,
        sizeSqFt: 280,
        bedType: "Queen Bed",
        maxGuests: 2,
        shortPitch: "Naturally ventilated, perfect for cooler seasons.",
        features: ["Ceiling Fan", "Queen Bed", "Smart TV", "Work Desk"],
        images: [PLACEHOLDER_STANDARD],
        roomCount: 3,
      },
    ],
  },
  {
    id: "deluxe",
    name: "Deluxe Room",
    tagline: "Spacious. Refined. Unforgettable.",
    heroImage:
      "https://images.unsplash.com/photo-1771206331424-44b8ec9acdf4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGxvYmJ5JTIwcHJlbWl1bSUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3Nzg1MjE3MDV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    galleryImages: [
      PLACEHOLDER_DELUXE,
      PLACEHOLDER_DELUXE,
      PLACEHOLDER_DELUXE,
      PLACEHOLDER_DELUXE,
    ],
    description:
      "Spacious rooms with premium furnishings, upgraded amenities, and stunning city or garden views — perfect for longer stays. Our Super Deluxe variant adds a seating lounge and panoramic windows for an even more elevated experience.",
    highlights: ["King Bed", "380 sq ft", "3 Guests", "Garden View"],
    amenities: [
      "Free High-Speed Wi-Fi",
      "55\" Smart TV",
      "Luxury Bathroom",
      "Premium Toiletries",
      "Mini Bar",
      "Daily Turn-down Service",
      "Tea / Coffee Maker",
      "In-room Safe",
    ],
    highlight: true,
    variants: [
      {
        id: "deluxe",
        name: "Deluxe",
        pricePerNight: 1699,
        sizeSqFt: 380,
        bedType: "King Bed",
        maxGuests: 3,
        shortPitch: "Upgraded furnishings with a king bed and garden view.",
        features: ["King Bed", "Air Conditioning", "Garden View", "Luxury Bathroom"],
        images: [PLACEHOLDER_DELUXE],
        roomCount: 4,
      },
      {
        id: "super-deluxe",
        name: "Super Deluxe",
        pricePerNight: 1899,
        sizeSqFt: 420,
        bedType: "King Bed",
        maxGuests: 3,
        shortPitch: "Adds a seating lounge and panoramic windows.",
        features: [
          "King Bed",
          "Seating Lounge",
          "Panoramic Windows",
          "Premium Toiletries",
        ],
        images: [PLACEHOLDER_DELUXE],
        roomCount: 3,
      },
    ],
  },
  {
    id: "suite",
    name: "Suite",
    tagline: "An Exclusive Sanctuary",
    heroImage:
      "https://images.unsplash.com/photo-1561811358-21aef14f0551?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHN3aW1taW5nJTIwcG9vbCUyMHJlc29ydCUyMGx1eHVyeSUyMG91dGRvb3J8ZW58MXx8fHwxNzc4NTIxNzA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    galleryImages: [
      PLACEHOLDER_SUITE,
      PLACEHOLDER_SUITE,
      PLACEHOLDER_SUITE,
      PLACEHOLDER_SUITE,
    ],
    description:
      "Our exclusive suite offers the complete luxury experience — a separate living area, premium décor, and personalised service. Designed for honeymoons, anniversaries, and once-in-a-lifetime celebrations.",
    highlights: ["King + Lounge", "560 sq ft", "4 Guests", "Jacuzzi Bath"],
    amenities: [
      "Free High-Speed Wi-Fi",
      "65\" Smart TV",
      "Jacuzzi Bath",
      "Separate Living Area",
      "Dining Space",
      "Priority Room Service",
      "Late Checkout",
      "Welcome Amenities",
    ],
    variants: [
      {
        id: "suite",
        name: "Suite",
        pricePerNight: 3199,
        sizeSqFt: 560,
        bedType: "King Bed + Lounge",
        maxGuests: 4,
        shortPitch:
          "The full sanctuary — living area, jacuzzi, and priority service.",
        features: [
          "King Bed + Lounge",
          "Jacuzzi Bath",
          "Dining Area",
          "Late Checkout",
        ],
        images: [PLACEHOLDER_SUITE],
        roomCount: 1,
      },
    ],
  },
];

/**
 * 12 physical rooms, distributed across the 5 variants:
 *   - 4 Standard  (1 AC + 3 Non-AC)
 *   - 7 Deluxe    (4 Deluxe + 3 Super Deluxe)
 *   - 1 Suite
 */
export const individualRooms: IndividualRoom[] = [
  // Standard AC
  { id: "room-010", roomNumber: "010", variantId: "standard-ac", floor: 1, view: "Garden View" },
  // Standard Non-AC
  { id: "room-003", roomNumber: "003", variantId: "standard-non-ac", floor: 1, view: "Garden View" },
  { id: "room-005", roomNumber: "005", variantId: "standard-non-ac", floor: 1, view: "Garden View" },
  { id: "room-012", roomNumber: "012", variantId: "standard-non-ac", floor: 1, view: "Garden View" },
  // Deluxe
  { id: "room-002", roomNumber: "002", variantId: "deluxe", floor: 1, view: "Garden View" },
  { id: "room-004", roomNumber: "004", variantId: "deluxe", floor: 1, view: "Garden View" },
  { id: "room-006", roomNumber: "006", variantId: "deluxe", floor: 1, view: "Pool View" },
  { id: "room-008", roomNumber: "008", variantId: "deluxe", floor: 1, view: "Pool View" },
  // Super Deluxe
  { id: "room-007", roomNumber: "007", variantId: "super-deluxe", floor: 1, view: "Pool View" },
  { id: "room-009", roomNumber: "009", variantId: "super-deluxe", floor: 1, view: "Pool View" },
  { id: "room-011", roomNumber: "011", variantId: "super-deluxe", floor: 1, view: "Skyline View" },
  // Suite
  { id: "room-001", roomNumber: "001", variantId: "suite", floor: 1, view: "Skyline View" },
];

/**
 * Admin-managed list. Currently empty. To test availability, append a row
 * here in this file, save, and reload — the variant selector will reflect
 * it immediately.
 */
export const roomBookings: RoomBooking[] = [];

/* ======================================================================
   Helpers
   ====================================================================== */

export function getCategoryById(id: string): RoomCategory | undefined {
  return roomCategories.find((c) => c.id === id);
}

export function getRoomsForVariant(variantId: string): IndividualRoom[] {
  return individualRooms.filter((r) => r.variantId === variantId);
}

export function getBookingsForRoom(roomId: string): RoomBooking[] {
  return roomBookings.filter((b) => b.roomId === roomId);
}

/**
 * True if `[checkIn, checkOut)` does NOT overlap any existing booking on
 * this specific room. Half-open: a guest checking out on the same day
 * another checks in is fine.
 */
export function isRoomAvailable(
  roomId: string,
  checkIn: string,
  checkOut: string
): boolean {
  return !roomBookings.some(
    (b) =>
      b.roomId === roomId &&
      // overlap if requested checkIn < existing checkOut AND requested checkOut > existing checkIn
      checkIn < b.checkOut &&
      checkOut > b.checkIn
  );
}

/**
 * Returns the first available room belonging to `variantId` for the given
 * date range, or `null` if every room in that variant is blocked.
 */
export function findAvailableRoomForVariant(
  variantId: string,
  checkIn: string,
  checkOut: string
): IndividualRoom | null {
  const rooms = getRoomsForVariant(variantId);
  return rooms.find((r) => isRoomAvailable(r.id, checkIn, checkOut)) ?? null;
}

/** Count of un-booked rooms in a variant for the given date range. */
export function countAvailableInVariant(
  variantId: string,
  checkIn: string,
  checkOut: string
): number {
  return getRoomsForVariant(variantId).filter((r) =>
    isRoomAvailable(r.id, checkIn, checkOut)
  ).length;
}

/** Lowest per-night price across a category's variants. */
export function getStartingPrice(category: RoomCategory): number {
  return Math.min(...category.variants.map((v) => v.pricePerNight));
}

/** Sum of `roomCount` across the variants — used by hotel/page.tsx card. */
export function getTotalRoomCount(category: RoomCategory): number {
  return category.variants.reduce((sum, v) => sum + v.roomCount, 0);
}
