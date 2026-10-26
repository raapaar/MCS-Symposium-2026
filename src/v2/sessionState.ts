import { createContext, useContext } from "react";
import type { User } from "firebase/auth";
export type Role = "customer" | "staff" | "admin" | "superuser";
export const Session = createContext<{
  user: User | null;
  role: Role;
  loading: boolean;
}>({ user: null, role: "customer", loading: true });
export const isStaffRole = (role: string) =>
  ["staff", "admin", "superuser"].includes(role);
export const useSession = () => useContext(Session);
