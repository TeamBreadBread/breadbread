/**
 * 액세스 토큰 페이로드의 `subject`(백엔드 회원 PK 문자열)를 정수로 변환합니다.
 * 표시 검증에는 사용하지 않고, “내 후기” 매칭 등에만 씁니다.
 */
export function getUserIdFromAccessToken(): number | undefined {
  if (typeof localStorage === "undefined") {
    return undefined;
  }
  try {
    const token = localStorage.getItem("breadbread_access_token");
    if (!token) return undefined;
    const seg = token.split(".")[1];
    if (!seg) return undefined;
    let b64 = seg.replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (b64.length % 4)) % 4;
    if (pad) b64 += "=".repeat(pad);
    const json = JSON.parse(atob(b64)) as { sub?: string };
    const n = Number.parseInt(json.sub ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  } catch {
    return undefined;
  }
}
