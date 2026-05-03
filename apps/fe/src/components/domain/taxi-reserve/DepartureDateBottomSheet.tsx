import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { cn } from "@/utils/cn";

export interface DepartureDateBottomSheetProps {
  open: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (isoLocal: string) => void;
}

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
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

function buildMonthGrid(year: number, month1: number) {
  const first = new Date(year, month1 - 1, 1);
  const startOffset = first.getDay();
  const gridStart = new Date(year, month1 - 1, 1 - startOffset);
  const cells: { date: Date }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({ date: d });
  }
  const rows: (typeof cells)[] = [];
  for (let r = 0; r < 6; r++) {
    rows.push(cells.slice(r * 7, r * 7 + 7));
  }
  return rows;
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 6l-6 6 6 6"
        stroke="#1a1c20"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 6l6 6-6 6"
        stroke="#1a1c20"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path d="M8 8l12 12M20 8L8 20" stroke="#1a1c20" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function DepartureDateBottomSheet({
  open,
  value,
  onClose,
  onConfirm,
}: DepartureDateBottomSheetProps) {
  const todayStart = useMemo(() => startOfLocalDay(new Date()), []);

  const [viewYear, setViewYear] = useState(() => todayStart.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => todayStart.getMonth() + 1);
  const [pending, setPending] = useState("");

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      if (value) {
        const d = parseIsoLocal(value);
        if (d) {
          setViewYear(d.getFullYear());
          setViewMonth(d.getMonth() + 1);
          setPending(value);
          return;
        }
      }
      setViewYear(todayStart.getFullYear());
      setViewMonth(todayStart.getMonth() + 1);
      setPending("");
    });
  }, [open, value, todayStart]);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const goPrevMonth = () => {
    setViewMonth((m) => {
      if (m <= 1) {
        setViewYear((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  };

  const goNextMonth = () => {
    setViewMonth((m) => {
      if (m >= 12) {
        setViewYear((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  };

  const handleSelectDay = (d: Date) => {
    const dayStart = startOfLocalDay(d);
    if (dayStart < todayStart) return;
    setPending(toIsoLocal(d));
  };

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
          aria-labelledby="departure-date-sheet-title"
          className={cn(
            "pointer-events-auto flex flex-col items-start justify-start gap-[16px] overflow-hidden rounded-tl-[24px] rounded-tr-[24px] bg-white",
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

          <div className="relative flex w-full flex-row items-start justify-between px-0 py-0 pr-[20px] pl-[20px]">
            <div className="flex flex-1 flex-col items-center justify-start gap-[6px]">
              <div
                id="departure-date-sheet-title"
                className="w-full text-left font-['Pretendard',sans-serif] text-[20px] font-bold leading-[27px] tracking-normal text-[#1a1c20]"
              >
                출발일
              </div>
              <div className="w-full text-left font-['Pretendard',sans-serif] text-[14px] leading-[19px] tracking-normal text-[#555d6d]">
                택시에 탑승할 날짜를 선택해주세요
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
            <div className="flex flex-1 flex-col items-center justify-start">
              <div className="flex w-full flex-col items-center justify-start gap-[12px] overflow-hidden bg-white pb-[10px] pl-0 pr-0 pt-[18px]">
                <div className="flex w-[148px] flex-row items-center justify-start">
                  <button
                    type="button"
                    className="shrink-0 p-0"
                    onClick={goPrevMonth}
                    aria-label="이전 달"
                  >
                    <ChevronLeft />
                  </button>
                  <div className="flex-1 text-center font-['Pretendard',sans-serif] text-[18px] font-medium leading-[24px] tracking-normal text-[#1a1c20]">
                    {viewYear}.{pad2(viewMonth)}
                  </div>
                  <button
                    type="button"
                    className="shrink-0 p-0"
                    onClick={goNextMonth}
                    aria-label="다음 달"
                  >
                    <ChevronRight />
                  </button>
                </div>

                <div className="flex flex-col items-start justify-start gap-[3px]">
                  <div className="flex flex-row items-center justify-start gap-[2px]">
                    {WEEK_LABELS.map((label) => (
                      <div
                        key={label}
                        className="flex h-[50px] w-[50px] shrink-0 flex-col items-center justify-center px-[18px] py-[14px]"
                      >
                        <span className="whitespace-nowrap text-center font-['Pretendard',sans-serif] text-[16px] leading-[22px] tracking-normal text-[#555d6d]">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {grid.map((row, ri) => (
                    <div key={ri} className="flex flex-row items-center justify-start gap-[2px]">
                      {row.map(({ date }, ci) => {
                        const iso = toIsoLocal(date);
                        const dayStart = startOfLocalDay(date);
                        const isPast = dayStart < todayStart;
                        const isSelected = pending === iso;
                        const isSunday = date.getDay() === 0;

                        return (
                          <button
                            key={`${ri}-${ci}-${iso}`}
                            type="button"
                            disabled={isPast}
                            onClick={() => handleSelectDay(date)}
                            className={cn(
                              "flex h-[50px] w-[50px] shrink-0 flex-col items-center justify-center rounded-[8px] px-[18px] py-[14px]",
                              isSelected && "bg-[#555d6d]",
                              !isSelected && !isPast && "hover:bg-[#f7f8f9]",
                            )}
                          >
                            <span
                              className={cn(
                                "whitespace-nowrap text-center font-['Pretendard',sans-serif] text-[16px] leading-[22px] tracking-normal",
                                isSelected && "font-medium text-white",
                                !isSelected && isPast && "text-[#d1d3d8]",
                                !isSelected && !isPast && isSunday && "text-[#fa342c]",
                                !isSelected && !isPast && !isSunday && "text-[#1a1c20]",
                              )}
                            >
                              {date.getDate()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
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
