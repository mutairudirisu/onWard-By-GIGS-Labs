"use client";

import { createContext, useContext } from "react";

export type AdminSession = {
  email: string;
  name: string;
  initials: string;
  signOut: () => Promise<void>;
};

export const AdminSessionContext = createContext<AdminSession | null>(null);

export function useAdminSession() {
  return useContext(AdminSessionContext);
}
