import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";

const PATH = "/reservations";

export type ReservationStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export type ReservationSummary = {
  id: number;
  courseNameSnapshot: string;
  departure: string;
  departureDate: string;
  departureTime: string;
  headCount: number;
  status: ReservationStatus;
  createdAt: string;
};

export type ReservationCourseBakery = {
  id: number;
  name: string;
  region: string;
  rating: number;
  thumbnailUrl: string;
};

export type ReservationCourse = {
  id: number;
  name: string;
  thumbnailUrl: string;
  bakeryCount: number;
  estimatedTime: string;
  estimatedCost: number;
  likeCount: number;
  liked: boolean;
  bakeries: ReservationCourseBakery[];
};

export type ReservationDetail = {
  id: number;
  departureDate: string;
  departureTime: string;
  departure: string;
  status: ReservationStatus;
  createdAt: string;
  course: ReservationCourse;
  headCount: number;
  quotedAmount: number;
  cancelledAt: string | null;
};

export type CreateReservationRequest = {
  courseId: number;
  departureDate: string;
  departureTime: string;
  headCount: number;
  departure: string;
  lat: number;
  lng: number;
};

export type UpdateReservationRequest = {
  departureDate: string;
  departureTime: string;
  departure: string;
  lat: number;
  lng: number;
  headCount: number;
};

export async function getMyReservations(status?: ReservationStatus): Promise<ReservationSummary[]> {
  const { data } = await apiClient.get<ApiEnvelope<ReservationSummary[]>>(PATH, {
    params: status ? { status } : undefined,
  });
  return extractData(data);
}

export async function createReservation(payload: CreateReservationRequest): Promise<number> {
  const { data } = await apiClient.post<ApiEnvelope<number>>(PATH, payload);
  return extractData(data);
}

export async function getReservationById(id: number): Promise<ReservationDetail> {
  const { data } = await apiClient.get<ApiEnvelope<ReservationDetail>>(`${PATH}/${id}`);
  return extractData(data);
}

export async function updateReservation(
  id: number,
  payload: UpdateReservationRequest,
): Promise<void> {
  const { data } = await apiClient.patch<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${id}`,
    payload,
  );
  extractData(data);
}

export async function cancelReservation(id: number): Promise<void> {
  const { data } = await apiClient.patch<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${id}/cancel`,
  );
  extractData(data);
}
