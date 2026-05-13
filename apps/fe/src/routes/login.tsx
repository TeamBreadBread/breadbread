import { createFileRoute } from "@tanstack/react-router";
import LoginPage from "@/pages/LoginPage";

function parseLoginRedirect(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const t = value.trim();
  if (!t.startsWith("/") || t.startsWith("//")) {
    return undefined;
  }
  if (t.includes("?") || t.includes("#") || t.includes("://")) {
    return undefined;
  }
  return t;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: parseLoginRedirect(search.redirect),
  }),
  component: LoginPage,
});
