"use client";

import { cancelOrderAction } from "../actions";

/** Small client wrapper so the confirm() guard can live on the form
 *  without making the whole order detail page a client component.
 *  The server action stays the source of truth — this component just
 *  hangs an onSubmit on top of the same <form action=…> wiring. */
export function CancelOrderForm({ orderId }: { orderId: string }) {
  return (
    <form
      action={cancelOrderAction}
      onSubmit={(e) => {
        if (!window.confirm("Cancel this order? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={orderId} />
      <input type="hidden" name="reason" value="Cancelled by staff." />
      <button type="submit" className="admin-button admin-button--danger">
        Cancel order
      </button>
    </form>
  );
}
