import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { cn } from "@/utils/cn";

export interface DepartureTimeBottomSheetProps {
  open: boolean;
  /** `HH:mm` (24h), e.g. `09:30` */
  value: string;
  /** `yyyy-mm-dd` — when today, past 30분 단위 슬롯 비활성 */
  departureDate: string;
  onClose: () => void;
  onConfirm: (hhmm: string) => void;
}

function CloseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path d="M8 8l12 12M20 8L8 20" stroke="#1a1c20" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function parseIsoLocal(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const dt = new Date(y, mo - 1, da);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== da) return null;
  return dt;
}

function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const AM_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"] as const;

const PM_SLOTS: string[] = (() => {
  const list: string[] = [];
  for (let h = 12; h <= 23; h++) {
    list.push(`${String(h).padStart(2, "0")}:00`);
    list.push(`${String(h).padStart(2, "0")}:30`);
  }
  return list;
})();

function isSlotDisabled(departureDate: string, slot: string): boolean {
  if (!departureDate) return false;
  const day = parseIsoLocal(departureDate);
  if (!day) return false;
  const today = startOfLocalDay(new Date());
  if (day.getTime() !== today.getTime()) return false;

  const [hh, mm] = slot.split(":").map(Number);
  const at = new Date(day);
  at.setHours(hh, mm, 0, 0);
  return at.getTime() < Date.now();
}

function TimeChip({
  slot,
  selected,
  disabled,
  onPick,
}: {
  slot: string;
  selected: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-row items-center justify-center overflow-hidden rounded-[8px] border border-solid border-[#dcdee3] px-[10px] py-[12px]",
        selected && "border-transparent bg-[#555d6d]",
        disabled && "cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "whitespace-nowrap font-['Pretendard',sans-serif] text-[14px] leading-[19px] tracking-normal",
          selected && "font-medium text-white",
          !selected && disabled && "text-[#d1d3d8]",
          !selected && !disabled && "text-[#1a1c20]",
        )}
      >
        {slot}
      </span>
    </button>
  );
}

function SlotRow({
  slots,
  departureDate,
  pending,
  setPending,
}: {
  slots: readonly string[] | string[];
  departureDate: string;
  pending: string;
  setPending: (v: string) => void;
}) {
  return (
    <div className="flex w-full flex-row items-center justify-start gap-[8px] overflow-hidden">
      {slots.map((slot) => (
        <TimeChip
          key={slot}
          slot={slot}
          selected={pending === slot}
          disabled={isSlotDisabled(departureDate, slot)}
          onPick={() => setPending(slot)}
        />
      ))}
    </div>
  );
}

export default function DepartureTimeBottomSheet({
  open,
  value,
  departureDate,
  onClose,
  onConfirm,
}: DepartureTimeBottomSheetProps) {
  const [pending, setPending] = useState("");
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      queueMicrotask(() => {
        let next = value && value.length > 0 ? value : "";
        if (next && isSlotDisabled(departureDate, next)) next = "";
        setPending(next);
      });
    }
    if (open && wasOpenRef.current) {
      queueMicrotask(() => {
        setPending((p) => (p && isSlotDisabled(departureDate, p) ? "" : p));
      });
    }
    wasOpenRef.current = open;
  }, [open, value, departureDate]);

  const pmRows = useMemo(() => {
    const chunk = 6;
    const rows: string[][] = [];
    for (let i = 0; i < PM_SLOTS.length; i += chunk) {
      rows.push(PM_SLOTS.slice(i, i + chunk));
    }
    return rows;
  }, []);

  const handleConfirm = () => {
    if (!pending) return;
    onConfirm(pending);
    onClose();
  };

  if (!open) return null;

  const sheet = (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="바텀시트 닫기"
        onClick={onClose}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 flex items-end justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="departure-time-sheet-title"
          className={cn(
            "pointer-events-auto flex max-h-[min(90vh,820px)] flex-col items-start justify-start gap-[16px] overflow-y-auto overflow-x-hidden rounded-tl-[24px] rounded-tr-[24px] bg-white",
            RESPONSIVE_FRAME_WIDTH,
          )}
        >
          <button
            type="button"
            className="relative flex h-[24px] w-full shrink-0 cursor-pointer items-center justify-center overflow-hidden bg-white"
            onClick={onClose}
            aria-label="닫기"
          >
            <span className="h-[4px] w-[36px] shrink-0 rounded-[9999px] bg-[#dcdee3]" aria-hidden />
          </button>

          <div className="relative flex w-full flex-row items-start justify-between px-[20px] py-0">
            <div className="flex flex-1 flex-col items-center justify-start gap-[6px]">
              <div
                id="departure-time-sheet-title"
                className="w-full text-left font-['Pretendard',sans-serif] text-[20px] font-bold leading-[27px] tracking-normal text-[#1a1c20]"
              >
                출발 시간
              </div>
              <div className="w-full text-left font-['Pretendard',sans-serif] text-[14px] leading-[19px] tracking-normal text-[#555d6d]">
                택시에 탑승할 시간을 선택해주세요
              </div>
            </div>
            <button
              type="button"
              className="absolute right-[20px] top-0 flex h-[40px] w-[40px] shrink-0 items-center justify-center overflow-hidden"
              onClick={onClose}
              aria-label="닫기"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex w-full flex-row items-start justify-start px-[20px] py-0">
            <div className="flex flex-1 flex-col items-start justify-start">
              <div className="flex w-full flex-col items-start justify-start gap-[20px] overflow-hidden bg-white pb-1">
                <div className="flex w-full flex-col items-start justify-start gap-[6px]">
                  <div className="w-full font-['Pretendard',sans-serif] text-[14px] font-medium leading-[19px] tracking-normal text-[#555d6d]">
                    오전
                  </div>
                  <SlotRow
                    slots={AM_SLOTS}
                    departureDate={departureDate}
                    pending={pending}
                    setPending={setPending}
                  />
                </div>

                <div className="flex w-full flex-col items-start justify-start gap-[6px]">
                  <div className="w-full font-['Pretendard',sans-serif] text-[14px] font-medium leading-[19px] tracking-normal text-[#555d6d]">
                    오후
                  </div>
                  <div className="flex w-full flex-col items-start justify-start gap-[8px]">
                    {pmRows.map((row) => (
                      <SlotRow
                        key={row.join("-")}
                        slots={row}
                        departureDate={departureDate}
                        pending={pending}
                        setPending={setPending}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-start justify-start">
            <div className="flex w-full flex-row items-start justify-start overflow-hidden bg-white px-[20px] py-[12px]">
              <button
                type="button"
                disabled={!pending}
                onClick={handleConfirm}
                className={cn(
                  "flex h-[56px] flex-1 flex-row items-center justify-center overflow-hidden rounded-[12px] px-[20px] py-[16px]",
                  pending
                    ? "cursor-pointer bg-[#555d6d]"
                    : "cursor-not-allowed bg-[#dcdee3] opacity-60",
                )}
              >
                <span className="whitespace-nowrap text-center font-['Pretendard',sans-serif] text-[18px] font-bold leading-[24px] tracking-normal text-white">
                  선택 완료
                </span>
              </button>
            </div>
            <div className="h-[33px] w-full shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
