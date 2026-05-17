import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { menuImageUrl } from "@/lib/menu-repo";
import { getItemAdmin, listAllCategoriesAdmin } from "@/lib/menu-admin";
import { MenuItemForm, type MenuItemFormValues } from "../_components/MenuItemForm";
import { MenuImageUploader } from "../_components/MenuImageUploader";
import { DeleteItemButton } from "../_components/DeleteItemButton";
import "../../../admin.css";
import "../../menu-admin.css";

export const dynamic = "force-dynamic";

export default async function EditMenuItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const { ok, error } = await searchParams;

  const [item, categories] = await Promise.all([
    getItemAdmin(id),
    listAllCategoriesAdmin(),
  ]);

  if (!item) notFound();

  const initial: MenuItemFormValues = {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description ?? "",
    note: item.note ?? "",
    isVeg: item.isVeg,
    isAvailable: item.isAvailable,
    sortOrder: item.sortOrder,
    priceSingleRupees:
      item.priceSinglePaise != null ? String(item.priceSinglePaise / 100) : "",
    priceHalfRupees:
      item.priceHalfPaise != null ? String(item.priceHalfPaise / 100) : "",
    priceFullRupees:
      item.priceFullPaise != null ? String(item.priceFullPaise / 100) : "",
  };

  const imageUrl = menuImageUrl(item.imagePath);

  return (
    <div>
      <Link href="/admin/menu" className="admin-back-link">
        <ArrowLeft size={14} />
        <span>All menu items</span>
      </Link>

      <div className="admin-toolbar">
        <h1 className="admin-h1" style={{ marginBottom: 0 }}>
          Edit item
        </h1>
        <DeleteItemButton itemId={item.id} itemName={item.name} />
      </div>

      {ok === "updated" && (
        <div className="admin-alert admin-alert--success">Saved.</div>
      )}
      {ok === "created" && (
        <div className="admin-alert admin-alert--success">Item created.</div>
      )}
      {ok === "image-uploaded" && (
        <div className="admin-alert admin-alert--success">Image uploaded.</div>
      )}
      {ok === "image-removed" && (
        <div className="admin-alert admin-alert--success">Image removed.</div>
      )}
      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <div className="menu-edit-grid">
        <MenuImageUploader itemId={item.id} currentUrl={imageUrl} />
        <MenuItemForm
          mode="edit"
          values={initial}
          categories={categories.map((c) => ({ id: c.id, title: c.title }))}
        />
      </div>
    </div>
  );
}
