"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

/**
 * Client-side cart for /restaurant/order (Phase 3).
 *
 *   • State lives in a React context fed by useReducer.
 *   • Persisted to localStorage on every change; hydrated once on mount.
 *   • No dependency on Supabase or the server — the cart re-prices
 *     authoritatively on checkout (Phase 4) via menu-repo lookups, so the
 *     snapshot fields stored here are display-only.
 *
 * Snapshot fields are kept tiny on purpose: enough to render the cart
 * sheet and floating bar without re-fetching the menu, nothing more. The
 * server will not trust any of these values when creating an order.
 */

export type CartVariant = "single" | "half" | "full";

export type CartItem = {
  menuItemId: string;
  variant: CartVariant;
  qty: number;
  // Display snapshot — re-priced on checkout.
  name: string;
  unitPricePaise: number;
  imageUrl: string | null;
  isVeg: boolean;
};

type CartState = {
  items: CartItem[];
  hydrated: boolean;
};

const initialState: CartState = { items: [], hydrated: false };

type Action =
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "ADD"; item: CartItem }
  | { type: "SET_QTY"; menuItemId: string; variant: CartVariant; qty: number }
  | { type: "REMOVE"; menuItemId: string; variant: CartVariant }
  | { type: "CLEAR" };

function lineKey(menuItemId: string, variant: CartVariant) {
  return `${menuItemId}::${variant}`;
}

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items, hydrated: true };

    case "ADD": {
      const key = lineKey(action.item.menuItemId, action.item.variant);
      const idx = state.items.findIndex(
        (i) => lineKey(i.menuItemId, i.variant) === key
      );
      if (idx === -1) {
        return { ...state, items: [...state.items, action.item] };
      }
      const next = state.items.slice();
      next[idx] = { ...next[idx], qty: next[idx].qty + action.item.qty };
      return { ...state, items: next };
    }

    case "SET_QTY": {
      if (action.qty <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (i) =>
              lineKey(i.menuItemId, i.variant) !==
              lineKey(action.menuItemId, action.variant)
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          lineKey(i.menuItemId, i.variant) ===
          lineKey(action.menuItemId, action.variant)
            ? { ...i, qty: action.qty }
            : i
        ),
      };
    }

    case "REMOVE":
      return {
        ...state,
        items: state.items.filter(
          (i) =>
            lineKey(i.menuItemId, i.variant) !==
            lineKey(action.menuItemId, action.variant)
        ),
      };

    case "CLEAR":
      return { ...state, items: [] };

    default:
      return state;
  }
}

const STORAGE_KEY = "shehnai.cart.v1";

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  totalCount: number;
  totalPaise: number;
  addItem: (item: CartItem) => void;
  setQty: (menuItemId: string, variant: CartVariant, qty: number) => void;
  removeItem: (menuItemId: string, variant: CartVariant) => void;
  clear: () => void;
  qtyOf: (menuItemId: string, variant: CartVariant) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydratedRef = useRef(false);

  // Hydrate once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      const items = Array.isArray(parsed) ? (parsed as CartItem[]) : [];
      dispatch({ type: "HYDRATE", items });
    } catch {
      dispatch({ type: "HYDRATE", items: [] });
    } finally {
      hydratedRef.current = true;
    }
  }, []);

  // Persist after every change — but only after the first hydration tick,
  // otherwise we'd clobber the stored cart with an empty array on first render.
  useEffect(() => {
    if (!state.hydrated || !hydratedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Quota / privacy mode — non-fatal.
    }
  }, [state.items, state.hydrated]);

  const totalCount = useMemo(
    () => state.items.reduce((s, i) => s + i.qty, 0),
    [state.items]
  );
  const totalPaise = useMemo(
    () => state.items.reduce((s, i) => s + i.unitPricePaise * i.qty, 0),
    [state.items]
  );

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: "ADD", item });
  }, []);
  const setQty = useCallback(
    (menuItemId: string, variant: CartVariant, qty: number) => {
      dispatch({ type: "SET_QTY", menuItemId, variant, qty });
    },
    []
  );
  const removeItem = useCallback(
    (menuItemId: string, variant: CartVariant) => {
      dispatch({ type: "REMOVE", menuItemId, variant });
    },
    []
  );
  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const qtyOf = useCallback(
    (menuItemId: string, variant: CartVariant) => {
      const found = state.items.find(
        (i) =>
          lineKey(i.menuItemId, i.variant) === lineKey(menuItemId, variant)
      );
      return found?.qty ?? 0;
    },
    [state.items]
  );

  const value: CartContextValue = {
    items: state.items,
    hydrated: state.hydrated,
    totalCount,
    totalPaise,
    addItem,
    setQty,
    removeItem,
    clear,
    qtyOf,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}
