/** API·DB에서 오는 순간(UTC 등)을 한국 표준시 기준으로 표시할 때 사용합니다. */
const SEOUL = "Asia/Seoul";

/**
 * 타임존 오프셋이 없는 ISO 형태는 UTC 순간으로 해석합니다.
 * (백엔드가 UTC로 저장·직렬화하는 경우와 맞춤)
 */
export function parseBackendInstant(value: string): Date {
  const t = value.trim();
  if (!t) return new Date(NaN);
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(t);
  if (hasTz) {
    return new Date(t);
  }
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(t)) {
    const normalized = t.includes("T") ? t : t.replace(" ", "T");
    return new Date(`${normalized}Z`);
  }
  return new Date(t);
}

/** 목록용 `yy.mm.dd` (서울 기준) */
export function formatShortListDate(iso: string): string {
  const { date } = formatInstantInSeoul(iso);
  const [y, m, d] = date.split(".");
  if (!y || y.length < 4) return date;
  return `${y.slice(2)}.${m}.${d}`;
}

export function formatInstantInSeoul(iso: string): { date: string; time: string } {
  const d = parseBackendInstant(iso);
  if (Number.isNaN(d.getTime())) {
    return { date: "-", time: "" };
  }

  const dateFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: SEOUL,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const datePart = dateFmt.format(d).replace(/-/g, ".");
  const timePart = timeFmt.format(d);
  return { date: datePart, time: timePart };
}
