import { auth, signIn, signOut } from "@/auth";
import { isAuthConfigured } from "@/lib/auth-env";

export async function AuthButtons() {
  const configured = isAuthConfigured();
  const session = configured ? await auth() : null;
  const label =
    session?.user?.name?.trim() ||
    session?.user?.email?.trim() ||
    null;

  if (session?.user) {
    return (
      <div className="auth-controls">
        <span className="auth-user" title={session.user.email ?? undefined}>
          {label}
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className="btn secondary">
            Odhlásit
          </button>
        </form>
      </div>
    );
  }

  if (!configured) {
    return (
      <span className="auth-missing" title="Na Vercelu chybí AUTH_* proměnné">
        Přihlášení není nastavené
      </span>
    );
  }

  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      <button type="submit" className="btn secondary">
        Přihlásit se přes Google
      </button>
    </form>
  );
}
