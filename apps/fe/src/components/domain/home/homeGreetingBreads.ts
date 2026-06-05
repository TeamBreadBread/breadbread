export const HOME_GREETING_BREADS = [
  "명란소금빵",
  "소보로",
  "크루아상",
  "바게트",
  "크림빵",
  "단팥빵",
  "마늘빵",
  "베이글",
  "마카롱",
  "스콘",
  "카스테라",
  "프레첼",
  "식빵",
  "초코머핀",
  "튀김소보로",
  "슈크림빵",
  "호두파이",
  "찐빵",
] as const;

export function pickRandomHomeGreetingBread(): string {
  const index = Math.floor(Math.random() * HOME_GREETING_BREADS.length);
  return HOME_GREETING_BREADS[index] ?? HOME_GREETING_BREADS[0];
}
