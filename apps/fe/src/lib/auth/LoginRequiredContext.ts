import { createContext } from "react";

export type LoginRequiredContextValue = {
  requireLogin: (onAuthorized: () => void, redirectPath?: string) => void;
};

export const LoginRequiredContext = createContext<LoginRequiredContextValue | null>(null);
