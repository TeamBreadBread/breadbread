export type HomeGreetingBread = {
  name: string;
  emoji: string;
};

export const HOME_GREETING_BREADS: readonly HomeGreetingBread[] = [
  { name: "명란소금빵", emoji: "🥐" },
  { name: "소보로", emoji: "🥐" },
  { name: "크루아상", emoji: "🥐" },
  { name: "바게트", emoji: "🥖" },
  { name: "크림빵", emoji: "🍞" },
  { name: "단팥빵", emoji: "🫘" },
  { name: "마늘빵", emoji: "🧄" },
  { name: "베이글", emoji: "🥯" },
  { name: "마카롱", emoji: "🍪" },
  { name: "스콘", emoji: "🧁" },
  { name: "카스테라", emoji: "🍰" },
  { name: "프레첼", emoji: "🥨" },
  { name: "식빵", emoji: "🍞" },
  { name: "초코머핀", emoji: "🧁" },
  { name: "튀김소보로", emoji: "🥐" },
  { name: "슈크림빵", emoji: "🍮" },
  { name: "호두파이", emoji: "🥧" },
  { name: "찐빵", emoji: "🥟" },
] as const;

export function pickRandomHomeGreetingBread(): HomeGreetingBread {
  const index = Math.floor(Math.random() * HOME_GREETING_BREADS.length);
  return HOME_GREETING_BREADS[index] ?? HOME_GREETING_BREADS[0];
}
