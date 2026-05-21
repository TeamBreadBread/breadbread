import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";

const PATH = "/notifications";

export type RegisterFcmTokenRequest = {
  token: string;
};

export async function registerFcmToken(body: RegisterFcmTokenRequest): Promise<void> {
  const { data } = await apiClient.post<ApiEnvelope<Record<string, never>>>(
    `${PATH}/fcm-token`,
    body,
  );
  extractData(data);
}
