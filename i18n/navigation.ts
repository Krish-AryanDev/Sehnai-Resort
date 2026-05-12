import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Drop-in replacements for next/link, useRouter, usePathname, redirect —
// these versions auto-prefix the active locale on internal links.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);