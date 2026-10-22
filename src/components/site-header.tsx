import Link from "next/link";
import type { ReactNode } from "react";
import { AuthButtons } from "@/components/auth-buttons";

export async function SiteHeader({
  nav,
  actions,
  showAdmin = true,
}: {
  nav?: ReactNode;
  /** Extra controls before auth / Administrace (e.g. Vložit aukci). */
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
        <AuthButtons />
        {showAdmin && (
          <Link className="btn secondary" href="/sprava">
            Administrace
          </Link>
        )}
      </div>
    </header>
  );
}
