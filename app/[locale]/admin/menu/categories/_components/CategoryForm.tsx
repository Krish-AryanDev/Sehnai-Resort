"use client";

import { useTransition } from "react";
import { createMenuCategory, updateMenuCategory } from "../../actions";

export type CategoryFormValues = {
  id: string;          // editable on create only
  title: string;
  subtitle: string;
  sortOrder: number;
  isActive: boolean;
};

export function CategoryForm({
  mode,
  values,
}: {
  mode: "create" | "edit";
  values: CategoryFormValues;
}) {
  const [pending, startTransition] = useTransition();
  const action = mode === "create" ? createMenuCategory : updateMenuCategory;

  return (
    <form
      action={(fd) => startTransition(() => action(fd))}
      className="admin-card"
    >
      {mode === "edit" && <input type="hidden" name="id" value={values.id} />}

      <div className="admin-field admin-field--row">
        <div>
          <label htmlFor="id">Slug</label>
          <input
            id="id"
            name="id"
            type="text"
            defaultValue={values.id}
            required
            placeholder="tandoor"
            readOnly={mode === "edit"}
            // The slug is the FK that menu_items rely on; renaming it would
            // need a cascading update. Editing is locked after create.
            style={mode === "edit" ? { background: "#fafaf9", color: "#78716c" } : undefined}
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

      <div className="admin-field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={values.title}
          required
          placeholder="Tandoor Snacks"
          autoComplete="off"
        />
      </div>

      <div className="admin-field">
        <label htmlFor="subtitle">Subtitle (optional)</label>
        <input
          id="subtitle"
          name="subtitle"
          type="text"
          defaultValue={values.subtitle}
          placeholder="From the live charcoal grill"
          autoComplete="off"
        />
      </div>

      <div className="menu-checks">
        <label className="menu-check">
          <input
            type="checkbox"
            name="isActive"
            value="1"
            defaultChecked={values.isActive}
          />
          Visible on storefront
        </label>
      </div>

      <div className="menu-form-footer">
        <button
          type="submit"
          className="admin-button admin-button--primary"
          disabled={pending}
        >
          {pending
            ? "Saving…"
            : mode === "create"
            ? "Create category"
            : "Save changes"}
        </button>
      </div>
    </form>
  );
}
