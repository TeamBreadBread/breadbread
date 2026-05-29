import { useContext } from "react";
import {
  LoginRequiredContext,
  type LoginRequiredContextValue,
} from "@/lib/auth/LoginRequiredContext";

export function useLoginRequired(): LoginRequiredContextValue {
  const ctx = useContext(LoginRequiredContext);
  if (!ctx) {
    throw new Error("useLoginRequired must be used within LoginRequiredProvider");
  }
  return ctx;
}
