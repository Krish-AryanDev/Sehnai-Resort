import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { CategoryForm, type CategoryFormValues } from "../_components/CategoryForm";
import "../../../admin.css";
import "../../menu-admin.css";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
    title?: string;
    subtitle?: string;
    sortOrder?: string;
    error?: string;
  }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const values: CategoryFormValues = {
    id: sp.id ?? "",
    title: sp.title ?? "",
    subtitle: sp.subtitle ?? "",
    sortOrder: Number(sp.sortOrder) || 9000,
    isActive: true,
  };

  return (
    <div>
      <Link href="/admin/menu" className="admin-back-link">
        <ArrowLeft size={14} />
        <span>All menu categories</span>
      </Link>

      <h1 className="admin-h1">New menu category</h1>

      {sp.error && (
        <div className="admin-alert admin-alert--error">{sp.error}</div>
      )}

      <CategoryForm mode="create" values={values} />

      <p
        style={{
          color: "#a8a29e",
          fontSize: 12,
          marginTop: "0.75rem",
        }}
      >
        The slug is used in URLs and as the foreign key on items. It cannot
        be changed after creation — choose carefully (lowercase letters,
        digits and hyphens only).
      </p>
    </div>
  );
}
