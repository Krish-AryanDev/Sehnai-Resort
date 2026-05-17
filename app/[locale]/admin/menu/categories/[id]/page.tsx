import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { getCategoryAdmin, listAllItemsAdmin } from "@/lib/menu-admin";
import { CategoryForm, type CategoryFormValues } from "../_components/CategoryForm";
import "../../../admin.css";
import "../../menu-admin.css";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const { ok, error } = await searchParams;

  const [category, allItems] = await Promise.all([
    getCategoryAdmin(id),
    listAllItemsAdmin(),
  ]);

  if (!category) notFound();

  const itemCount = allItems.filter((i) => i.categoryId === category.id).length;

  const values: CategoryFormValues = {
    id: category.id,
    title: category.title,
    subtitle: category.subtitle ?? "",
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  };

  return (
    <div>
      <Link href="/admin/menu" className="admin-back-link">
        <ArrowLeft size={14} />
        <span>All menu categories</span>
      </Link>

      <h1 className="admin-h1">Edit category</h1>

      {ok === "updated" && (
        <div className="admin-alert admin-alert--success">Saved.</div>
      )}
      {ok === "created" && (
        <div className="admin-alert admin-alert--success">Category created.</div>
      )}
      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <CategoryForm mode="edit" values={values} />

      <p
        style={{
          color: "#a8a29e",
          fontSize: 12,
          marginTop: "0.75rem",
        }}
      >
        {itemCount} item{itemCount === 1 ? "" : "s"} in this category. Hiding
        a category removes it from the storefront but leaves its items
        intact — they re-appear when you make the category visible again.
      </p>
    </div>
  );
}
