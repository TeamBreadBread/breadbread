import { createFileRoute } from "@tanstack/react-router";
import PortOnePaymentRedirectPage from "@/pages/PortOnePaymentRedirectPage";

function parseQuery(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }
  return undefined;
}

export const Route = createFileRoute("/payment/portone-redirect")({
  validateSearch: (search: Record<string, unknown>) => ({
    paymentId: parseQuery(search.paymentId),
    code: parseQuery(search.code),
    message: parseQuery(search.message),
  }),
  component: PortOnePaymentRedirectRoute,
});

function PortOnePaymentRedirectRoute() {
  const { paymentId, code, message } = Route.useSearch();
  return <PortOnePaymentRedirectPage paymentId={paymentId} code={code} message={message} />;
}
