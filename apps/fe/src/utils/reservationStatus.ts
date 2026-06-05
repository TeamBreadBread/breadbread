import type { ReservationStatus } from "@/api/reservation";

export function statusToKorean(status: ReservationStatus): string {
  switch (status) {
    case "PENDING":
      return "대기";
    case "CONFIRMED":
      return "확정";
    case "IN_PROGRESS":
      return "진행 중";
    case "COMPLETED":
      return "완료";
    case "CANCELLED":
      return "취소";
  }
}
