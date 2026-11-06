import { createContext, useContext } from "react";
import type { User } from "firebase/auth";
export type Role = "customer" | "staff" | "admin" | "superuser";
export const Session = createContext<{
  user: User | null;
  role: Role;
  loading: boolean;
  permissions: string[];
}>({ user: null, role: "customer", loading: true, permissions: [] });
export const isStaffRole = (role: string) =>
  ["staff", "admin", "superuser"].includes(role);
export const useSession = () => useContext(Session);

export const sectionPermissions = [
  "event",
  "presenters",
  "schedule",
  "announcements",
  "gallery",
  "documents",
  "staff",
  "sponsors",
  "merchandise",
  "orders",
  "payments",
  "appearance",
  "enquiries",
];
export function canEdit(role: string, permissions: string[], section: string) {
  return (
    role === "superuser" ||
    role === "admin" ||
    (role === "staff" && permissions.includes(section))
  );
}
