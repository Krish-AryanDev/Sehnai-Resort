"use client";

import { useTransition } from "react";
import { signInWithPassword } from "./actions";

export function LoginForm({ defaultEmail }: { defaultEmail: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => signInWithPassword(formData))}
    >
      <div className="admin-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={defaultEmail}
          placeholder="owner@example.com"
        />
      </div>
      <div className="admin-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <button
        type="submit"
        className="admin-button admin-button--primary"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
