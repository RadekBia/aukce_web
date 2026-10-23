import Link from "next/link";
import type { ReactNode } from "react";

export function SiteHeader({
  nav,
  actions,
  showAdmin = true,
}: {
  nav?: ReactNode;
  /** Extra controls before Administrace (e.g. Vložit aukci). */
  actions?: ReactNode;
  showAdmin?: boolean;
}) {
  return (
    <header>
      <Link className="brand" href="/">
        Aukceee <span>na dobrou Věc</span>
      </Link>
      {nav ? <nav>{nav}</nav> : <nav aria-hidden="true" />}
      <div className="header-actions">
        {actions}
        {showAdmin && (
          <Link className="btn secondary" href="/sprava">
            Administrace
          </Link>
        )}
      </div>
    </header>
  );
}
