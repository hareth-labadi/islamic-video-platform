import type { AnchorHTMLAttributes, ReactNode } from "react";
import { vi } from "vitest";

/*
 * Stand-ins for next/navigation and next/link: jsdom has no Next router.
 * In a test file:
 *   vi.mock("next/navigation", () => import("../../test/next").then((m) => m.navigation));
 *   vi.mock("next/link", () => import("../../test/next").then((m) => m.link));
 */

export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

const location = { pathname: "/ar/admin", search: new URLSearchParams(), params: {} as Record<string, string> };

/** Where the "browser" is: path with query string, plus dynamic route params. */
export function setLocation(path: string, params: Record<string, string> = {}): void {
  const url = new URL(path, "http://localhost");
  location.pathname = url.pathname;
  location.search = url.searchParams;
  location.params = params;
}

export function resetNavigation(): void {
  Object.values(router).forEach((fn) => fn.mockClear());
  setLocation("/ar/admin");
}

export const navigation = {
  useRouter: () => router,
  usePathname: () => location.pathname,
  useSearchParams: () => location.search,
  useParams: () => location.params,
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
};

function Link({ href, children, onNavigate, prefetch, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode; onNavigate?: unknown; prefetch?: unknown }) {
  void onNavigate;
  void prefetch;
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

export const link = { default: Link };
