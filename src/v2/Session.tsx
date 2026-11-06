import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";

import { Session } from "./sessionState";
import { useSession, isStaffRole, canEdit } from "./sessionState";
import type { Role } from "./sessionState";
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    user: User | null;
    role: Role;
    loading: boolean;
    permissions: string[];
  }>({ user: null, role: "customer", loading: true, permissions: [] });
  useEffect(() => {
    let stopRole = () => {};
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopRole();
      if (!user) {
        setState({
          user: null,
          role: "customer",
          loading: false,
          permissions: [],
        });
        return;
      }
      setState({ user, role: "customer", loading: true, permissions: [] });
      stopRole = onSnapshot(
        doc(db, "users", user.uid),
        (snapshot) => {
          const data = snapshot.data();
          const role: Role =
            data?.active !== false &&
            ["staff", "admin", "superuser"].includes(data?.role)
              ? (data?.role as Role)
              : "customer";
          setState({
            user,
            role,
            loading: false,
            permissions: Array.isArray(data?.permissions)
              ? data.permissions.filter(
                  (p: unknown): p is string => typeof p === "string",
                )
              : [],
          });
        },
        () =>
          setState({ user, role: "customer", loading: false, permissions: [] }),
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
  section,
}: {
  children: ReactNode;
  ownerOnly?: boolean;
  section?: string;
}) {
  const session = useSession();
  if (session.loading)
    return <main className="control-message">Checking access…</main>;
  if (
    !session.user ||
    !isStaffRole(session.role) ||
    (ownerOnly && session.role !== "superuser") ||
    (!!section && !canEdit(session.role, session.permissions, section))
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
