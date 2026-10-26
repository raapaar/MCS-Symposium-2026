import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";

import { Session } from "./sessionState";
import { useSession, isStaffRole } from "./sessionState";
import type { Role } from "./sessionState";
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    user: User | null;
    role: Role;
    loading: boolean;
  }>({ user: null, role: "customer", loading: true });
  useEffect(() => {
    let stopRole = () => {};
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopRole();
      if (!user) {
        setState({ user: null, role: "customer", loading: false });
        return;
      }
      setState({ user, role: "customer", loading: true });
      stopRole = onSnapshot(
        doc(db, "users", user.uid),
        (snapshot) => {
          const data = snapshot.data();
          const role: Role =
            data?.active !== false &&
            ["staff", "admin", "superuser"].includes(data?.role)
              ? (data?.role as Role)
              : "customer";
          setState({ user, role, loading: false });
        },
        () => setState({ user, role: "customer", loading: false }),
      );
    });
    return () => {
      stopAuth();
      stopRole();
    };
  }, []);
  return <Session.Provider value={state}>{children}</Session.Provider>;
}
export function ProtectedArea({
  children,
  ownerOnly = false,
}: {
  children: ReactNode;
  ownerOnly?: boolean;
}) {
  const session = useSession();
  if (session.loading)
    return <main className="control-message">Checking access…</main>;
  if (
    !session.user ||
    !isStaffRole(session.role) ||
    (ownerOnly && session.role !== "superuser")
  )
    return (
      <main className="control-message">
        <h1>Access restricted</h1>
        <p>
          Please sign in with an authorized {ownerOnly ? "superuser" : "staff"}{" "}
          account.
        </p>
        <a href="/admin">Staff sign in ↗</a>
        <a href="/">Return to symposium</a>
      </main>
    );
  return <>{children}</>;
}
