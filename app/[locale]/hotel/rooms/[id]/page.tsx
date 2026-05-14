import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getCategoryById, roomCategories } from "@/lib/rooms-data";
import { getBookingsForCategory } from "@/lib/bookings-db";
import { RoomDetailContent } from "./_components/RoomDetailContent";

/** Pre-build /hotel/rooms/standard, /deluxe, /suite × every locale at build time. */
export function generateStaticParams() {
  return roomCategories.flatMap((cat) =>
    routing.locales.map((locale) => ({ locale, id: cat.id }))
  );
}

/** ISR: the static shell is regenerated at most every 30s so admin blocks
 *  added in Supabase land on the public site without a redeploy. */
export const revalidate = 30;

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const category = getCategoryById(id);
  if (!category) notFound();

  const bookings = await getBookingsForCategory(category.id);

  return <RoomDetailContent category={category} bookings={bookings} />;
}
