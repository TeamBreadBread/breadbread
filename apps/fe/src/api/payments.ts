import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";

const PATH = "/payments";

export type PreparePaymentMethod =
  | "CARD"
  | "TRANSFER"
  | "VIRTUAL_ACCOUNT"
  | "MOBILE"
  | "EASY_PAY"
  | "GIFT_CERTIFICATE";

export type PreparePaymentMethodDetail =
  | "NAVER_PAY"
  | "KAKAO_PAY"
  | "TOSS_PAY"
  | "CARD"
  | "BANK_TRANSFER"
  | "MOBILE";

export type PreparePaymentRequest = {
  reservationId: number;
  paymentMethod: PreparePaymentMethod;
  paymentMethodDetail: PreparePaymentMethodDetail;
};

export type PreparePaymentResponse = {
  paymentId: string;
  orderName: string;
  amount: number;
  paymentMethod: PreparePaymentMethod;
  pgProvider: string;
  customerName: string;
  customerPhone: string;
  storeId: string | null;
  channelKey: string | null;
};

export type CompletePaymentRequest = {
  paymentId: string;
};

export type CompletePaymentResponse = {
  paymentId: string;
  reservationId: number;
  status: string;
  amount: number;
  paidAt: string | null;
};

export async function preparePayment(body: PreparePaymentRequest): Promise<PreparePaymentResponse> {
  const { data } = await apiClient.post<ApiEnvelope<PreparePaymentResponse>>(
    `${PATH}/prepare`,
    body,
  );
  return extractData(data);
}

export async function completePayment(
  body: CompletePaymentRequest,
): Promise<CompletePaymentResponse> {
  const { data } = await apiClient.post<ApiEnvelope<CompletePaymentResponse>>(
    `${PATH}/complete`,
    body,
  );
  return extractData(data);
}
