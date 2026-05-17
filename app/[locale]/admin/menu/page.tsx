import Link from "next/link";
import { Pencil, Plus, Image as ImageIcon } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { menuImageUrl } from "@/lib/menu-repo";
import { listAllCategoriesAdmin, listAllItemsAdmin } from "@/lib/menu-admin";
import { toggleItemAvailability } from "./actions";
import "../admin.css";
import "./menu-admin.css";

export const dynamic = "force-dynamic";

const RUPEES = (paise: number | null) =>
  paise == null ? "—" : `₹${(paise / 100).toLocaleString("en-IN")}`;

function priceLabel(item: {
  priceSinglePaise: number | null;
  priceHalfPaise: number | null;
  priceFullPaise: number | null;
}): string {
  if (item.priceSinglePaise != null) return RUPEES(item.priceSinglePaise);
  if (item.priceHalfPaise != null && item.priceFullPaise != null) {
    return `${RUPEES(item.priceHalfPaise)} / ${RUPEES(item.priceFullPaise)}`;
  }
  if (item.priceFullPaise != null) return RUPEES(item.priceFullPaise);
  return RUPEES(item.priceHalfPaise);
}

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();

  const { ok, error } = await searchParams;

  const [categories, items] = await Promise.all([
    listAllCategoriesAdmin(),
    listAllItemsAdmin(),
  ]);

  // Bucket items by category for the per-section table render.
  const itemsByCategory = new Map<string, typeof items>();
  for (const it of items) {
    const bucket = itemsByCategory.get(it.categoryId);
    if (bucket) bucket.push(it);
    else itemsByCategory.set(it.categoryId, [it]);
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-h1" style={{ marginBottom: 0 }}>Menu</h1>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <Link
            href="/admin/menu/categories/new"
            className="admin-button admin-button--secondary"
          >
            + Category
          </Link>
          <Link
            href="/admin/menu/items/new"
            className="admin-button admin-button--primary"
          >
            <Plus size={14} /> New item
          </Link>
        </div>
      </div>

      {ok && (
        <div className="admin-alert admin-alert--success">
          {ok === "created" && "Item created."}
          {ok === "updated" && "Saved."}
          {ok === "deleted" && "Deleted."}
          {ok === "image-uploaded" && "Image uploaded."}
          {ok === "image-removed" && "Image removed."}
        </div>
      )}
      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <p
        style={{
          color: "#78716c",
          fontSize: 13,
          marginBottom: "1rem",
        }}
      >
        {categories.length} categories · {items.length} items.
        Toggle a row's availability to instantly hide it from the storefront.
      </p>

      {categories.map((cat) => {
        const its = itemsByCategory.get(cat.id) ?? [];
        return (
          <div key={cat.id} className="admin-card menu-cat-card">
            <div className="menu-cat-header">
              <div>
                <h2 className="admin-h2 menu-cat-title">
                  {cat.title}
                  {!cat.isActive && (
                    <span
                      className="admin-pill admin-pill--cancelled"
                      style={{ marginLeft: 8 }}
                    >
                      Hidden
                    </span>
                  )}
                </h2>
                {cat.subtitle && (
                  <p className="menu-cat-subtitle">{cat.subtitle}</p>
                )}
                <p className="menu-cat-meta">
                  Slug: <code>{cat.id}</code> · sort {cat.sortOrder} · {its.length} item
                  {its.length === 1 ? "" : "s"}
                </p>
              </div>
              <Link
                href={`/admin/menu/categories/${cat.id}`}
                className="admin-button admin-button--secondary"
              >
                <Pencil size={13} /> Edit
              </Link>
            </div>

            {its.length === 0 ? (
              <p className="menu-empty">No items in this category yet.</p>
            ) : (
              <>
              {/* Mobile: stacked cards. CSS hides one or the other at 720px. */}
              <div className="menu-cards">
                {its.map((it) => {
                  const url = menuImageUrl(it.imagePath);
                  return (
                    <div
                      key={it.id}
                      className={
                        "menu-card" +
                        (it.isAvailable ? "" : " menu-card--unavailable")
                      }
                    >
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="" className="menu-card-thumb" />
                      ) : (
                        <div className="menu-card-thumb menu-card-thumb--empty">
                          <ImageIcon size={18} />
                        </div>
                      )}
                      <div className="menu-card-body">
                        <div className="menu-card-title-row">
                          <VegDot veg={it.isVeg} />
                          <div className="menu-card-name">{it.name}</div>
                        </div>
                        <div className="menu-card-meta">
                          <span className="menu-card-price">
                            {priceLabel(it)}
                          </span>
                          <span>sort {it.sortOrder}</span>
                          {it.note && <span>({it.note})</span>}
                        </div>
                        <div className="menu-card-actions">
                          <form action={toggleItemAvailability}>
                            <input type="hidden" name="id" value={it.id} />
                            <input
                              type="hidden"
                              name="next"
                              value={it.isAvailable ? "0" : "1"}
                            />
                            <button
                              type="submit"
                              className={
                                "menu-toggle " +
                                (it.isAvailable
                                  ? "menu-toggle--on"
                                  : "menu-toggle--off")
                              }
                            >
                              <span className="menu-toggle-knob" />
                              <span className="menu-toggle-label">
                                {it.isAvailable ? "Available" : "Hidden"}
                              </span>
                            </button>
                          </form>
                          <Link
                            href={`/admin/menu/items/${it.id}`}
                            className="admin-link"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}></th>
                    <th>Name</th>
                    <th style={{ width: 60 }}>Veg</th>
                    <th style={{ width: 180 }}>Price</th>
                    <th style={{ width: 70 }}>Sort</th>
                    <th style={{ width: 140 }}>Available</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {its.map((it) => {
                    const url = menuImageUrl(it.imagePath);
                    return (
                      <tr
                        key={it.id}
                        className={
                          it.isAvailable
                            ? "menu-row"
                            : "menu-row menu-row--unavailable"
                        }
                      >
                        <td>
                          {url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={url}
                              alt=""
                              className="menu-thumb"
                            />
                          ) : (
                            <div className="menu-thumb menu-thumb--empty">
                              <ImageIcon size={14} />
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: "#1c1917" }}>
                            {it.name}
                          </div>
                          {it.note && (
                            <div style={{ fontSize: 11, color: "#78716c" }}>
                              ({it.note})
                            </div>
                          )}
                        </td>
                        <td>
                          <VegDot veg={it.isVeg} />
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {priceLabel(it)}
                        </td>
                        <td style={{ color: "#78716c" }}>{it.sortOrder}</td>
                        <td>
                          <form action={toggleItemAvailability}>
                            <input type="hidden" name="id" value={it.id} />
                            <input
                              type="hidden"
                              name="next"
                              value={it.isAvailable ? "0" : "1"}
                            />
                            <button
                              type="submit"
                              className={
                                "menu-toggle " +
                                (it.isAvailable
                                  ? "menu-toggle--on"
                                  : "menu-toggle--off")
                              }
                              aria-label={
                                it.isAvailable
                                  ? "Mark as unavailable"
                                  : "Mark as available"
                              }
                            >
                              <span className="menu-toggle-knob" />
                              <span className="menu-toggle-label">
                                {it.isAvailable ? "Available" : "Hidden"}
                              </span>
                            </button>
                          </form>
                        </td>
                        <td>
                          <Link
                            href={`/admin/menu/items/${it.id}`}
                            className="admin-link"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VegDot({ veg }: { veg: boolean }) {
  const stroke = veg ? "#3F7D2A" : "#A52A2A";
  return (
    <span
      aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 12,
        height: 12,
        border: `1.5px solid ${stroke}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: stroke,
        }}
      />
    </span>
  );
}
