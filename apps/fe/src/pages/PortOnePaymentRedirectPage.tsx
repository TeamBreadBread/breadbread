import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { completePayment } from "@/api/payments";
import { getErrorMessage } from "@/api/types/common";
import { clearTaxiReturnPayload, readTaxiReturnPayload } from "@/lib/portoneTaxiReturn";

/** 포트원 `redirectUrl` 복귀 — 쿼리의 `paymentId` / 오류 코드 처리 후 결제 검증 API 호출 */
export default function PortOnePaymentRedirectPage({
  paymentId: paymentIdParam,
  code,
  message,
}: {
  paymentId?: string;
  code?: string;
  message?: string;
}) {
  const navigate = useNavigate();

  const syncFailure = useMemo(() => {
    if (code != null && code !== "") {
      return message?.trim() || `결제가 완료되지 않았습니다. (${code})`;
    }
    const paymentId = paymentIdParam?.trim();
    if (!paymentId) {
      return "paymentId가 없습니다.";
    }
    return null;
  }, [code, message, paymentIdParam]);

  const [asyncError, setAsyncError] = useState<string | null>(null);

  useEffect(() => {
    if (syncFailure != null) {
      return;
    }

    const paymentId = (paymentIdParam ?? "").trim();
    if (!paymentId) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await completePayment({ paymentId });
        if (cancelled) {
          return;
        }
        const ret = readTaxiReturnPayload();
        clearTaxiReturnPayload();
        if (ret) {
          navigate({
            to: "/taxi-reservation-complete",
            search: {
              departureDate: ret.departureDate,
              departureTime: ret.departureTime,
              departurePlace: ret.departurePlace,
              passengers: ret.passengers,
              courseId: ret.courseId,
              paidAmount: ret.paidAmount ?? 0,
              courseName: ret.courseName ?? "",
            },
          });
        } else {
          navigate({ to: "/home" });
        }
      } catch (e) {
        if (cancelled) {
          return;
        }
        setAsyncError(getErrorMessage(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [syncFailure, paymentIdParam, navigate]);

  const errorText = syncFailure ?? asyncError;
  if (errorText) {
    const ret = readTaxiReturnPayload();
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-[16px] bg-[#f3f4f5] px-[20px]">
        <p className="text-center text-[15px] leading-[22px] text-[#1a1c20]">{errorText}</p>
        <button
          type="button"
          className="rounded-[8px] bg-[#1a1c20] px-[18px] py-[10px] text-[14px] font-medium text-white"
          onClick={() =>
            navigate({
              to: "/taxi-reserve",
              search: { courseId: ret && ret.courseId > 0 ? ret.courseId : null },
            })
          }
        >
          예약 화면으로
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-[#f3f4f5] px-[20px]">
      <p className="text-[15px] text-[#868b94]">결제 결과 확인 중…</p>
    </div>
  );
}
