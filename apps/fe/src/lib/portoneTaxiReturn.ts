const RETURN_KEY = "breadbread_portone_taxi_return";

export type TaxiReturnPayload = {
  departureDate: string;
  departureTime: string;
  departurePlace: string;
  passengers: number;
  courseId: number;
  /** 예약 확정 후 결제 금액(quotedAmount). 리다이렉트 결제 완료 화면 표시용 */
  paidAmount?: number;
  courseName?: string;
};

export function writeTaxiReturnPayload(payload: TaxiReturnPayload) {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.setItem(RETURN_KEY, JSON.stringify(payload));
}

export function readTaxiReturnPayload(): TaxiReturnPayload | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    if (!raw) {
      return null;
    }
    const o = JSON.parse(raw) as Partial<TaxiReturnPayload>;
    if (
      typeof o.departureDate !== "string" ||
      typeof o.departureTime !== "string" ||
      typeof o.departurePlace !== "string" ||
      typeof o.passengers !== "number" ||
      typeof o.courseId !== "number"
    ) {
      return null;
    }
    const paidAmount =
      typeof o.paidAmount === "number" && Number.isFinite(o.paidAmount) && o.paidAmount > 0
        ? o.paidAmount
        : undefined;
    const courseName = typeof o.courseName === "string" ? o.courseName.trim() : undefined;
    return {
      departureDate: o.departureDate,
      departureTime: o.departureTime,
      departurePlace: o.departurePlace,
      passengers: o.passengers,
      courseId: o.courseId,
      ...(paidAmount != null ? { paidAmount } : {}),
      ...(courseName ? { courseName } : {}),
    };
  } catch {
    return null;
  }
}

export function clearTaxiReturnPayload() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(RETURN_KEY);
  }
}
