import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllCategoriesAdmin } from "@/lib/menu-admin";
import { MenuItemForm, type MenuItemFormValues } from "../_components/MenuItemForm";
import "../../../admin.css";
import "../../menu-admin.css";

export const dynamic = "force-dynamic";

/**
 * New menu item form. Image upload is deferred to the edit page — the item
 * needs a UUID to anchor the storage path, and we get that after the first
 * insert. The create action redirects to /admin/menu/items/[newId]?ok=created
 * where the uploader is available.
 *
 * Form fields can be pre-populated via ?searchParams from a failed submit
 * (the server action redirects back here with the same fields encoded).
 */

export default async function NewMenuItemPage({
  searchParams,
}: {
  searchParams: Promise<{
    categoryId?: string;
    name?: string;
    description?: string;
    note?: string;
    sortOrder?: string;
    error?: string;
  }>;
}) {
  await requireAdmin();

  const sp = await searchParams;
  const categories = await listAllCategoriesAdmin();

  const initial: MenuItemFormValues = {
    id: null,
    categoryId: sp.categoryId ?? categories[0]?.id ?? "",
    name: sp.name ?? "",
    description: sp.description ?? "",
    note: sp.note ?? "",
    isVeg: true,
    isAvailable: true,
    sortOrder: Number(sp.sortOrder) || 1000,
    priceSingleRupees: "",
    priceHalfRupees: "",
    priceFullRupees: "",
  };

  return (
    <div>
      <Link href="/admin/menu" className="admin-back-link">
        <ArrowLeft size={14} />
        <span>All menu items</span>
      </Link>

      <h1 className="admin-h1">New menu item</h1>

      {sp.error && (
        <div className="admin-alert admin-alert--error">{sp.error}</div>
      )}

      {categories.length === 0 ? (
        <div className="admin-alert admin-alert--info">
          You need at least one category before you can add items.{" "}
          <Link href="/admin/menu/categories/new" className="admin-link">
            Create a category →
          </Link>
        </div>
      ) : (
        <MenuItemForm
          mode="create"
          values={initial}
          categories={categories.map((c) => ({ id: c.id, title: c.title }))}
        />
      )}

      <p
        style={{
          color: "#a8a29e",
          fontSize: 12,
          marginTop: "1rem",
        }}
      >
        Image upload becomes available after the item is created.
      </p>
    </div>
  );
}
