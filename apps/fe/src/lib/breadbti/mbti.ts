// MBTI 유형과 관련된 타입과 상수들을 정의하는 파일

// MBTI 성격 유형을 나타내는 4가지 지표와 각 지표의 양극을 나타내는 타입
export type MbtiTrait = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

// MBTI 점수와 유형을 나타내는 타입
export type MbtiScores = Record<MbtiTrait, number>;

export type MbtiType =
  | "INTJ"
  | "INTP"
  | "ENTJ"
  | "ENTP"
  | "INFJ"
  | "INFP"
  | "ENFJ"
  | "ENFP"
  | "ISTJ"
  | "ISFJ"
  | "ESTJ"
  | "ESFJ"
  | "ISTP"
  | "ISFP"
  | "ESTP"
  | "ESFP";

export type MbtiQuestion = {
  question: string;
  options: [
    {
      label: string;
      trait: MbtiTrait;
    },
    {
      label: string;
      trait: MbtiTrait;
    },
  ];
};

export type MbtiProfile = {
  group: "NT" | "NF" | "SJ" | "SP";
  bread: string;
  oneLine: string;
  description: string;
  goodMatches: Array<{
    mbti: MbtiType;
    bread: string;
  }>;
  badMatches: Array<{
    mbti: MbtiType;
    bread: string;
  }>;
};

export const INITIAL_SCORES: MbtiScores = {
  E: 0,
  I: 0,
  S: 0,
  N: 0,
  T: 0,
  F: 0,
  J: 0,
  P: 0,
};

// MBTI 질문 리스트와 각 유형에 따른 빵 매칭 정보를 담은 상수들
export const MBTI_QUESTIONS: MbtiQuestion[] = [
  {
    question: "주말에 나는?",
    options: [
      { label: "친구 만나서 논다", trait: "E" },
      { label: "집에서 쉰다", trait: "I" },
    ],
  },
  {
    question: "새로운 모임에서 나는?",
    options: [
      { label: "먼저 말 건다", trait: "E" },
      { label: "누가 말 걸어주길 기다린다", trait: "I" },
    ],
  },
  {
    question: "빵집을 고를 때 나는?",
    options: [
      { label: "리뷰 좋은 곳 간다", trait: "S" },
      { label: "감으로 끌리는 곳 간다", trait: "N" },
    ],
  },
  {
    question: "설명을 들을 때 나는?",
    options: [
      { label: "구체적인 게 좋다", trait: "S" },
      { label: "큰 그림이 좋다", trait: "N" },
    ],
  },
  {
    question: "친구가 고민 상담을 하면?",
    options: [
      { label: "해결 방법을 알려준다", trait: "T" },
      { label: "공감해준다", trait: "F" },
    ],
  },
  {
    question: "선택할 때 더 중요한 건?",
    options: [
      { label: "합리적인 판단", trait: "T" },
      { label: "기분 / 감정", trait: "F" },
    ],
  },
  {
    question: "여행 스타일은?",
    options: [
      { label: "계획 다 짠다", trait: "J" },
      { label: "가서 정한다", trait: "P" },
    ],
  },
  {
    question: "마감이 있는 일은?",
    options: [
      { label: "미리 한다", trait: "J" },
      { label: "막판에 한다", trait: "P" },
    ],
  },
  {
    question: "카페에서 나는?",
    options: [
      { label: "사람 구경이 재밌다", trait: "E" },
      { label: "혼자 생각하는 게 좋다", trait: "I" },
    ],
  },
  {
    question: "갑자기 약속이 취소되면?",
    options: [
      { label: "다른 계획 바로 세운다", trait: "J" },
      { label: "그냥 흐름에 맡긴다", trait: "P" },
    ],
  },
];

export const BREAD_MAP: Record<MbtiType, string> = {
  INTJ: "크로와상",
  INTP: "식빵",
  ENTJ: "바게트",
  ENTP: "프레첼",
  INFJ: "치즈케이크",
  INFP: "컵케이크",
  ENFJ: "생크림케이크",
  ENFP: "도넛",
  ISTJ: "통밀빵",
  ISFJ: "베이글",
  ESTJ: "마늘바게트",
  ESFJ: "버터롤",
  ISTP: "샌드위치",
  ISFP: "초코크로와상",
  ESTP: "핫도그",
  ESFP: "딸기케이크",
};

export const MBTI_PROFILE_MAP: Record<MbtiType, MbtiProfile> = {
  INTJ: {
    group: "NT",
    bread: "크로와상",
    oneLine: "겉바속촉, 완벽주의 전략가",
    description:
      "계획적이고 치밀한 당신. 겉은 차가워 보여도 속은 누구보다 따뜻하다. 완벽한 결과를 위해 시간을 아끼지 않는 타입.",
    goodMatches: [
      { mbti: "ENFP", bread: "도넛" },
      { mbti: "ESFP", bread: "딸기케이크" },
    ],
    badMatches: [
      { mbti: "ISTJ", bread: "통밀빵" },
      { mbti: "ESTJ", bread: "마늘바게트" },
    ],
  },
  INTP: {
    group: "NT",
    bread: "식빵",
    oneLine: "단순하지만 무한한 가능성",
    description: "겉보기엔 평범하지만 어떤 형태로든 변신 가능. 생각이 많고 논리적인 아이디어 뱅크.",
    goodMatches: [
      { mbti: "INFP", bread: "컵케이크" },
      { mbti: "ISFP", bread: "초코 크로와상" },
    ],
    badMatches: [
      { mbti: "ESTJ", bread: "마늘바게트" },
      { mbti: "ESTP", bread: "핫도그" },
    ],
  },
  ENTJ: {
    group: "NT",
    bread: "바게트",
    oneLine: "단단한 리더",
    description: "목표 지향적이고 추진력 강한 타입. 쉽게 휘어지지 않는 강한 멘탈의 소유자.",
    goodMatches: [
      { mbti: "ENFJ", bread: "생크림케이크" },
      { mbti: "ESFJ", bread: "버터롤" },
    ],
    badMatches: [
      { mbti: "ENFP", bread: "도넛" },
      { mbti: "ISTP", bread: "샌드위치" },
    ],
  },
  ENTP: {
    group: "NT",
    bread: "프레첼",
    oneLine: "꼬여있지만 매력적인 아이디어 머신",
    description: "틀에 얽매이지 않는 자유로운 사고. 장난기 + 창의력 폭발형.",
    goodMatches: [
      { mbti: "INFP", bread: "컵케이크" },
      { mbti: "ENFP", bread: "도넛" },
    ],
    badMatches: [
      { mbti: "ISTJ", bread: "통밀빵" },
      { mbti: "ISFJ", bread: "베이글" },
    ],
  },
  INFJ: {
    group: "NF",
    bread: "치즈케이크",
    oneLine: "부드럽고 깊은 감성",
    description: "조용하지만 깊은 내면을 가진 타입. 사람을 잘 이해하고 공감 능력이 뛰어나다.",
    goodMatches: [
      { mbti: "ENTJ", bread: "바게트" },
      { mbti: "INTJ", bread: "크로와상" },
    ],
    badMatches: [
      { mbti: "ESTP", bread: "핫도그" },
      { mbti: "ENFP", bread: "도넛" },
    ],
  },
  INFP: {
    group: "NF",
    bread: "컵케이크",
    oneLine: "작고 소중한 감성",
    description: "감수성이 풍부하고 따뜻한 성격. 귀엽고 순수한 매력 보유.",
    goodMatches: [
      { mbti: "INTP", bread: "식빵" },
      { mbti: "ENTP", bread: "프레첼" },
    ],
    badMatches: [
      { mbti: "ESTJ", bread: "마늘바게트" },
      { mbti: "ISTJ", bread: "통밀빵" },
    ],
  },
  ENFJ: {
    group: "NF",
    bread: "생크림 케이크",
    oneLine: "모두를 챙기는 리더",
    description: "주변 사람들을 잘 챙기고 분위기를 이끈다. 함께 있을 때 가장 빛나는 타입.",
    goodMatches: [
      { mbti: "ENTJ", bread: "바게트" },
      { mbti: "INTJ", bread: "크로와상" },
    ],
    badMatches: [
      { mbti: "ISTP", bread: "샌드위치" },
      { mbti: "ISFP", bread: "초코 크로와상" },
    ],
  },
  ENFP: {
    group: "NF",
    bread: "도넛",
    oneLine: "달콤한 에너지 폭발",
    description: "활발하고 밝은 에너지의 소유자. 어디서든 분위기 메이커.",
    goodMatches: [
      { mbti: "INTJ", bread: "크로와상" },
      { mbti: "ENTP", bread: "프레첼" },
    ],
    badMatches: [
      { mbti: "ENTJ", bread: "바게트" },
      { mbti: "ISTJ", bread: "통밀빵" },
    ],
  },
  ISTJ: {
    group: "SJ",
    bread: "통밀빵",
    oneLine: "꾸준함의 끝판왕",
    description: "책임감 있고 성실한 타입. 기본에 충실한 안정적인 사람.",
    goodMatches: [
      { mbti: "ISFJ", bread: "베이글" },
      { mbti: "ESTJ", bread: "마늘바게트" },
    ],
    badMatches: [
      { mbti: "ENFP", bread: "도넛" },
      { mbti: "ENTP", bread: "프레첼" },
    ],
  },
  ISFJ: {
    group: "SJ",
    bread: "베이글",
    oneLine: "든든한 존재",
    description: "조용히 주변을 챙기는 타입. 오래 곁에 두고 싶은 사람.",
    goodMatches: [
      { mbti: "ISTJ", bread: "통밀빵" },
      { mbti: "ESFJ", bread: "버터롤" },
    ],
    badMatches: [
      { mbti: "ENTP", bread: "프레첼" },
      { mbti: "ESTP", bread: "핫도그" },
    ],
  },
  ESTJ: {
    group: "SJ",
    bread: "마늘바게트",
    oneLine: "확실한 리더",
    description: "현실적이고 조직적인 스타일. 일을 확실하게 끝내는 타입.",
    goodMatches: [
      { mbti: "ISTJ", bread: "통밀빵" },
      { mbti: "ENFJ", bread: "생크림케이크" },
    ],
    badMatches: [
      { mbti: "INTP", bread: "식빵" },
      { mbti: "INFP", bread: "컵케이크" },
    ],
  },
  ESFJ: {
    group: "SJ",
    bread: "버터롤",
    oneLine: "부드러운 인기쟁이",
    description: "친화력 좋고 사람들과 잘 어울림. 어디서든 사랑받는 스타일.",
    goodMatches: [
      { mbti: "ENFJ", bread: "생크림케이크" },
      { mbti: "ISFJ", bread: "베이글" },
    ],
    badMatches: [
      { mbti: "ISTP", bread: "샌드위치" },
      { mbti: "ENTP", bread: "프레첼" },
    ],
  },
  ISTP: {
    group: "SP",
    bread: "샌드위치",
    oneLine: "실용적인 자유인",
    description: "필요할 때 빠르게 행동하는 타입. 효율과 실용성을 중시.",
    goodMatches: [
      { mbti: "ISFP", bread: "초코 크로와상" },
      { mbti: "INTP", bread: "식빵" },
    ],
    badMatches: [
      { mbti: "ENFJ", bread: "생크림케이크" },
      { mbti: "ESFJ", bread: "버터롤" },
    ],
  },
  ISFP: {
    group: "SP",
    bread: "초코 크로와상",
    oneLine: "감성 + 자유",
    description: "예술적 감각이 뛰어나고 감성적. 조용하지만 개성 강함.",
    goodMatches: [
      { mbti: "ISTP", bread: "샌드위치" },
      { mbti: "INFP", bread: "컵케이크" },
    ],
    badMatches: [
      { mbti: "ENTJ", bread: "바게트" },
      { mbti: "ESTJ", bread: "마늘바게트" },
    ],
  },
  ESTP: {
    group: "SP",
    bread: "핫도그",
    oneLine: "즉흥적인 액션형",
    description: "모험을 즐기고 활동적인 타입. 생각보다 행동이 빠름.",
    goodMatches: [
      { mbti: "ENFP", bread: "도넛" },
      { mbti: "ESFP", bread: "딸기케이크" },
    ],
    badMatches: [
      { mbti: "INFJ", bread: "치즈케이크" },
      { mbti: "ISFJ", bread: "베이글" },
    ],
  },
  ESFP: {
    group: "SP",
    bread: "딸기 케이크",
    oneLine: "인싸 그 자체",
    description: "사람들과 어울리는 걸 좋아하는 타입. 밝고 에너지 넘침.",
    goodMatches: [
      { mbti: "ENFP", bread: "도넛" },
      { mbti: "ESTP", bread: "핫도그" },
    ],
    badMatches: [
      { mbti: "INTJ", bread: "크로와상" },
      { mbti: "ISTJ", bread: "통밀빵" },
    ],
  },
};

export function isMbtiType(value: string): value is MbtiType {
  return Object.prototype.hasOwnProperty.call(BREAD_MAP, value);
}

// MBTI 점수에서 유형을 계산하는 함수
export function getMbti(scores: MbtiScores): MbtiType {
  const pickTrait = (
    leftScore: number,
    rightScore: number,
    leftTrait: "E" | "S" | "T" | "J",
    rightTrait: "I" | "N" | "F" | "P",
  ) => {
    // 점수가 같으면 랜덤으로 선택
    if (leftScore === rightScore) {
      return Math.random() > 0.5 ? leftTrait : rightTrait;
    }

    return leftScore > rightScore ? leftTrait : rightTrait;
  };

  const first = pickTrait(scores.E, scores.I, "E", "I");
  const second = pickTrait(scores.S, scores.N, "S", "N");
  const third = pickTrait(scores.T, scores.F, "T", "F");
  const fourth = pickTrait(scores.J, scores.P, "J", "P");

  return `${first}${second}${third}${fourth}` as MbtiType;
}
