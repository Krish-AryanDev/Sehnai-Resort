"use client";

import { useTransition } from "react";
import { updateRestaurantSettings } from "../actions";

/** All values arrive as display-friendly strings/numbers. Money is in RUPEES
 *  here (the action converts back to paise). */
export type SettingsFormValues = {
  deliveryEnabled: boolean;
  deliveryRadiusKm: number;
  deliveryFeeRupees: number;
  minOrderRupees: number;
  restaurantLat: string;   // "" when unset
  restaurantLng: string;
  kitchenOpenFrom: string; // "" or "HH:MM"
  kitchenOpenTo: string;
  gstPercent: number;
};

export function SettingsForm({ values }: { values: SettingsFormValues }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => startTransition(() => updateRestaurantSettings(fd))}
      className="admin-card settings-card"
    >
      {/* ---- Delivery ---- */}
      <h2 className="admin-h2">Delivery</h2>

      <div className="menu-checks">
        <label className="menu-check">
          <input
            type="checkbox"
            name="deliveryEnabled"
            value="1"
            defaultChecked={values.deliveryEnabled}
          />
          Accept off-premise delivery orders
        </label>
      </div>

      <div className="admin-field--row">
        <div className="admin-field">
          <label htmlFor="deliveryRadiusKm">Delivery radius (km)</label>
          <input
            id="deliveryRadiusKm"
            name="deliveryRadiusKm"
            type="number"
            min={0}
            max={100}
            step={0.5}
            defaultValue={values.deliveryRadiusKm}
            required
          />
        </div>
        <div className="admin-field">
          <label htmlFor="deliveryFee">Delivery fee (₹)</label>
          <input
            id="deliveryFee"
            name="deliveryFee"
            type="number"
            min={0}
            step={1}
            defaultValue={values.deliveryFeeRupees}
            required
          />
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor="minOrder">Minimum order (₹)</label>
        <input
          id="minOrder"
          name="minOrder"
          type="number"
          min={0}
          step={1}
          defaultValue={values.minOrderRupees}
          required
        />
        <p className="admin-hint">0 means no minimum.</p>
      </div>

      {/* ---- Restaurant location (radius origin) ---- */}
      <h2 className="admin-h2">Restaurant location</h2>
      <p className="admin-hint" style={{ marginTop: "-0.4rem", marginBottom: "0.75rem" }}>
        The point delivery distance is measured from. Set both, or leave both
        blank to disable radius checks. Tip: open Google Maps, right-click the
        resort, and copy the latitude, longitude pair.
      </p>

      <div className="admin-field--row">
        <div className="admin-field">
          <label htmlFor="restaurantLat">Latitude</label>
          <input
            id="restaurantLat"
            name="restaurantLat"
            type="text"
            inputMode="decimal"
            defaultValue={values.restaurantLat}
            placeholder="25.5941"
            autoComplete="off"
          />
        </div>
        <div className="admin-field">
          <label htmlFor="restaurantLng">Longitude</label>
          <input
            id="restaurantLng"
            name="restaurantLng"
            type="text"
            inputMode="decimal"
            defaultValue={values.restaurantLng}
            placeholder="85.1376"
            autoComplete="off"
          />
        </div>
      </div>

      {/* ---- Kitchen hours ---- */}
      <h2 className="admin-h2">Kitchen hours</h2>
      <p className="admin-hint" style={{ marginTop: "-0.4rem", marginBottom: "0.75rem" }}>
        Shown on the storefront. Leave blank to advertise as always open.
      </p>

      <div className="admin-field--row">
        <div className="admin-field">
          <label htmlFor="kitchenOpenFrom">Opens</label>
          <input
            id="kitchenOpenFrom"
            name="kitchenOpenFrom"
            type="time"
            defaultValue={values.kitchenOpenFrom}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="kitchenOpenTo">Closes</label>
          <input
            id="kitchenOpenTo"
            name="kitchenOpenTo"
            type="time"
            defaultValue={values.kitchenOpenTo}
          />
        </div>
      </div>

      {/* ---- Tax ---- */}
      <h2 className="admin-h2">Tax</h2>

      <div className="admin-field">
        <label htmlFor="gstPercent">GST (%)</label>
        <input
          id="gstPercent"
          name="gstPercent"
          type="number"
          min={0}
          max={100}
          step={0.5}
          defaultValue={values.gstPercent}
          required
        />
        <p className="admin-hint">Applied to the order subtotal at checkout.</p>
      </div>

      <div className="menu-form-footer">
        <button
          type="submit"
          className="admin-button admin-button--primary"
          disabled={pending}
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
