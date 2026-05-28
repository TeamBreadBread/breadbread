function formatDigitGroups(digits: string): string {
  if (digits.length === 11 && digits.startsWith("010")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 11 && digits.startsWith("050")) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  if (digits.length === 10 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

export function formatPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw.trim();
  return formatDigitGroups(digits);
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  const trimmed = phone?.trim();
  if (!trimmed) return "등록된 전화번호가 없습니다";
  return trimmed
    .split(",")
    .map((part) => formatPhoneNumber(part.trim()))
    .filter(Boolean)
    .join(", ");
}
