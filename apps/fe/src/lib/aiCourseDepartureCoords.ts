/** AI 코스 출발 좌표 — sessionStorage 대신 메모리에만 보관 (CodeQL 민감정보 평문 저장 회피) */
let pending: { latitude: number; longitude: number } | null = null;

export function setAiCourseDepartureCoords(latitude: number, longitude: number): void {
  pending = { latitude, longitude };
}

export function takeAiCourseDepartureCoords(): { latitude: number; longitude: number } | null {
  const value = pending;
  pending = null;
  return value;
}

export function clearAiCourseDepartureCoords(): void {
  pending = null;
}
