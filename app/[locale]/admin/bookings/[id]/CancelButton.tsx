"use client";

import { useTransition } from "react";
import { cancelBooking } from "./actions";

export function CancelButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="admin-button admin-button--danger"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Cancel this booking? The dates will be freed up on the public site.")) {
          return;
        }
        startTransition(() => cancelBooking(id));
      }}
    >
      {pending ? "Cancelling…" : "Cancel booking"}
    </button>
  );
}
