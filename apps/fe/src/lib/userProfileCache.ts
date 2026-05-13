import { getMyProfile } from "@/api/user";

/**
 * `GET /users/me` 결과를 저장해 마이 페이지·내 후기 표시 등에 같은 이름 규칙을 씁니다.
 * (네트워크 실패 시 동일 브라우저에 남은 캐시를 사용합니다.)
 */
export type CachedUserProfile = {
  /** `GET /users/me`의 `userId` — 없으면 JWT subject로 보완 */
  userId?: number;
  loginId: string;
  name: string;
  email: string;
  phone?: string;
};

const STORAGE_KEY = "breadbread_user_profile";
const NAMES_BY_LOGIN_ID_KEY = "breadbread_user_names_by_login_id";

export function saveUserProfile(profile: CachedUserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    if (profile.loginId.trim() && profile.name.trim()) {
      const names = getNamesByLoginId();
      names[profile.loginId.trim().toLowerCase()] = profile.name.trim();
      localStorage.setItem(NAMES_BY_LOGIN_ID_KEY, JSON.stringify(names));
    }
  } catch {
    /* ignore quota */
  }
}

export function getUserProfile(): CachedUserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedUserProfile;
    if (!parsed || typeof parsed.loginId !== "string") return null;
    const normalized = parsed.loginId.trim().toLowerCase();
    const names = getNamesByLoginId();
    const mappedName = names[normalized];
    if (
      mappedName &&
      (!parsed.name?.trim() ||
        parsed.name.trim().toLowerCase() === parsed.loginId.trim().toLowerCase())
    ) {
      const upgraded = {
        ...parsed,
        name: mappedName,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded));
      return upgraded;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** 로그인 아이디 기준으로 표시용 이름 (저장된 이름 없으면 아이디) */
export function getDisplayNameForLoginId(loginId: string): string {
  const normalized = loginId.trim().toLowerCase();
  const names = getNamesByLoginId();
  const fromMap = names[normalized];
  if (fromMap) {
    return fromMap;
  }
  const p = getUserProfile();
  if (p?.loginId.trim().toLowerCase() === normalized && p.name.trim()) {
    return p.name.trim();
  }
  return loginId.trim();
}

export function clearUserProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * 로그인 직후 다음 화면 전환을 막지 않도록, 아이디 기준 낙관적 캐시를 둔 뒤
 * GET /users/me로 서버 값을 백그라운드에서 반영합니다.
 */
export function seedProfileCacheThenRefreshFromServer(loginId: string): void {
  const trimmed = loginId.trim();
  if (!trimmed) return;
  saveUserProfile({
    loginId: trimmed,
    name: getDisplayNameForLoginId(trimmed),
    email: "",
    phone: "",
  });
  void getMyProfile()
    .then((me) => {
      const id = me.loginId?.trim() || trimmed;
      saveUserProfile({
        userId: me.userId != null ? Number(me.userId) : undefined,
        loginId: id,
        name: me.name?.trim() || getDisplayNameForLoginId(id),
        email: me.email ?? "",
        phone: me.phone ?? "",
      });
    })
    .catch(() => {
      /* 낙관적 캐시 유지 */
    });
}

/** 소셜 로그인 등 아이디를 미리 알 수 없을 때 — 토큰 저장 직후 비동기로 프로필만 갱신 */
export function refreshProfileCacheFromServer(): void {
  void getMyProfile()
    .then((me) => {
      const id = me.loginId?.trim() ?? "";
      saveUserProfile({
        userId: me.userId != null ? Number(me.userId) : undefined,
        loginId: me.loginId?.trim() || id,
        name: me.name?.trim() || getDisplayNameForLoginId(id),
        email: me.email ?? "",
        phone: me.phone ?? "",
      });
    })
    .catch(() => {
      /* ignore */
    });
}

function getNamesByLoginId(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NAMES_BY_LOGIN_ID_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}
