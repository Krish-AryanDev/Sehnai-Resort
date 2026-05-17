"use client";

import { useTransition } from "react";
import { createMenuItem, updateMenuItem } from "../../actions";

/**
 * Shared form for create + edit of a menu item. Renders the same fields
 * either way; the page wraps it with the right `mode` and either an
 * existing item or `null`.
 *
 * Prices are entered in RUPEES (admins think in rupees) and converted to
 * paise inside the server action. We render `priceSinglePaise / 100` etc.
 * back into the input on the edit path.
 */

export type MenuItemFormValues = {
  id: string | null;            // null = create
  categoryId: string;
  name: string;
  description: string;
  note: string;
  isVeg: boolean;
  isAvailable: boolean;
  sortOrder: number;
  priceSingleRupees: string;    // string so empty stays empty
  priceHalfRupees: string;
  priceFullRupees: string;
};

export type CategoryOption = { id: string; title: string };

export function MenuItemForm({
  mode,
  values,
  categories,
}: {
  mode: "create" | "edit";
  values: MenuItemFormValues;
  categories: CategoryOption[];
}) {
  const [pending, startTransition] = useTransition();
  const action = mode === "create" ? createMenuItem : updateMenuItem;

  return (
    <form
      action={(fd) => startTransition(() => action(fd))}
      className="admin-card"
    >
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="admin-field admin-field--row">
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={values.name}
            required
            autoComplete="off"
            placeholder="e.g. Paneer Butter Masala"
          />
        </div>
        <div>
          <label htmlFor="categoryId">Category</label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={values.categoryId}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={values.description}
          placeholder="Slow-cooked in a tomato-cashew gravy, finished with butter."
        />
      </div>

      <div className="admin-field admin-field--row">
        <div>
          <label htmlFor="note">Note (optional)</label>
          <input
            id="note"
            name="note"
            type="text"
            defaultValue={values.note}
            placeholder='e.g. "2 pcs" or "Serves 2"'
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="sortOrder">Sort order</label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            step={10}
            defaultValue={values.sortOrder}
          />
        </div>
      </div>

      <div className="menu-checks">
        <label className="menu-check">
          <input
            type="checkbox"
            name="isVeg"
            value="1"
            defaultChecked={values.isVeg}
          />
          Vegetarian
        </label>
        <label className="menu-check">
          <input
            type="checkbox"
            name="isAvailable"
            value="1"
            defaultChecked={values.isAvailable}
          />
          Available to order
        </label>
      </div>

      <h3
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#57534e",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        Pricing (₹) — set Single, OR set Half + Full
      </h3>
      <div className="menu-price-grid">
        <div className="admin-field" style={{ marginBottom: 0 }}>
          <label htmlFor="priceSingle">Single</label>
          <input
            id="priceSingle"
            name="priceSingle"
            type="number"
            min={0}
            step={1}
            defaultValue={values.priceSingleRupees}
            placeholder="199"
          />
        </div>
        <div className="admin-field" style={{ marginBottom: 0 }}>
          <label htmlFor="priceHalf">Half</label>
          <input
            id="priceHalf"
            name="priceHalf"
            type="number"
            min={0}
            step={1}
            defaultValue={values.priceHalfRupees}
            placeholder="175"
          />
        </div>
        <div className="admin-field" style={{ marginBottom: 0 }}>
          <label htmlFor="priceFull">Full</label>
          <input
            id="priceFull"
            name="priceFull"
            type="number"
            min={0}
            step={1}
            defaultValue={values.priceFullRupees}
            placeholder="290"
          />
        </div>
      </div>
      <p
        style={{
          fontSize: 11,
          color: "#a8a29e",
          marginTop: "0.4rem",
        }}
      >
        Most dishes use Single. Chicken / Mutton use Half + Full. Tandoor
        items that only have a full portion use Full alone.
      </p>

      <div className="menu-form-footer">
        <button
          type="submit"
          className="admin-button admin-button--primary"
          disabled={pending}
        >
          {pending
            ? "Saving…"
            : mode === "create"
            ? "Create item"
            : "Save changes"}
        </button>
      </div>
    </form>
  );
}
