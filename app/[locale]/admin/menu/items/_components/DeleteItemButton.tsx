"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteMenuItem } from "../../actions";

/**
 * Small client wrapper so we can attach an onClick confirm() to the submit
 * button. Server components can't have event handlers; everything else on
 * the edit page stays server-rendered.
 */
export function DeleteItemButton({
  itemId,
  itemName,
}: {
  itemId: string;
  itemName: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => startTransition(() => deleteMenuItem(fd))}
      onSubmit={(e) => {
        if (!window.confirm(`Delete "${itemName}"? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={itemId} />
      <button
        type="submit"
        className="admin-button admin-button--danger"
        disabled={pending}
      >
        <Trash2 size={13} />
        {pending ? "Deleting…" : "Delete"}
      </button>
    </form>
  );
}
