"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  /** Classes only when not current (keep colours here so they don't fight activeClassName). */
  inactiveClassName?: string;
  /** Match only the exact path (for home links). */
  exact?: boolean;
}

/** Link that marks itself as current (aria-current) when its route is open. */
export function NavLink({ href, children, className, activeClassName, inactiveClassName, exact }: NavLinkProps) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn(className, active ? activeClassName : inactiveClassName)}>
      {children}
    </Link>
  );
}
