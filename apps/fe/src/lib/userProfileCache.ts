/**
 * 서버에 `GET /users/me` 같은 프로필 API가 없을 때, 회원가입·로그인 시점에 저장해
 * 마이페이지 등에 표시할 이름/이메일을 유지합니다. (같은 기기·브라우저)
 */
export type CachedUserProfile = {
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
