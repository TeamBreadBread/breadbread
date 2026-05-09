import type { CommentItem, PostDetail, PostType } from "@/api/posts";

export type BbangteoBoardListRow = {
  id: number;
  title: string;
  thumbnailImageUrl: string | null;
  likeCount: number;
  commentCount: number;
  dateLabel: string;
  postType: PostType;
  /** API 최신순 정렬용 (mock은 생략 가능) */
  createdAt?: string;
};

/** 목·상세 mock 댓글 수 상한: 20 미만 (0~19) */
export const MOCK_COMMENT_COUNT_MAX = 19;

function clampMockCommentCount(count: number): number {
  return Math.min(Math.max(Math.trunc(count), 0), MOCK_COMMENT_COUNT_MAX);
}

/** 데모·로컬용 — 실 서버 게시글 id와 겹치지 않게 높은 번호대 사용 */
export const MOCK_FREE_BOARD_ITEMS: BbangteoBoardListRow[] = [
  {
    id: 910501,
    title: "방금 갓 나온 베이글 먹었는데 진짜 대박",
    thumbnailImageUrl: null,
    likeCount: 48,
    commentCount: 12,
    dateLabel: "26.05.07",
    postType: "FREE",
  },
  {
    id: 910502,
    title: "빵순이가 알려주는 주말 성심당 웨이팅 꿀팁",
    thumbnailImageUrl: null,
    likeCount: 112,
    commentCount: 15,
    dateLabel: "26.05.06",
    postType: "FREE",
  },
  {
    id: 910503,
    title: "빵 보관 어떻게 하세요? 냉동 vs 냉장 후기 공유합니다",
    thumbnailImageUrl: null,
    likeCount: 67,
    commentCount: 10,
    dateLabel: "26.05.05",
    postType: "FREE",
  },
  {
    id: 910504,
    title: "다이어트 중인데 빵못 참는데 정상이죠?…",
    thumbnailImageUrl: null,
    likeCount: 91,
    commentCount: 18,
    dateLabel: "26.05.04",
    postType: "FREE",
  },
  {
    id: 910505,
    title: "연남동 카공하기 좋은 베이커리 카페 추천 받아요!",
    thumbnailImageUrl: null,
    likeCount: 55,
    commentCount: 6,
    dateLabel: "26.05.03",
    postType: "FREE",
  },
  {
    id: 910506,
    title: "첫 레몬 크림 휘낭시에 도전했는데 이렇게 맞나요?",
    thumbnailImageUrl: null,
    likeCount: 34,
    commentCount: 9,
    dateLabel: "26.05.02",
    postType: "FREE",
  },
  {
    id: 910507,
    title: "오픈런 줄 서본 분들 줄 관리 노하우 있으면 알려주세요",
    thumbnailImageUrl: null,
    likeCount: 22,
    commentCount: 7,
    dateLabel: "26.05.01",
    postType: "FREE",
  },
  {
    id: 910508,
    title: "집 근처 단골 베이커리 분위기 바뀌었는데 다른 데 추천",
    thumbnailImageUrl: null,
    likeCount: 18,
    commentCount: 11,
    dateLabel: "26.04.30",
    postType: "FREE",
  },
  {
    id: 910509,
    title: "소금빵 vs 마늘바게트 당신의 픽은?",
    thumbnailImageUrl: null,
    likeCount: 204,
    commentCount: 16,
    dateLabel: "26.04.29",
    postType: "FREE",
  },
  {
    id: 910510,
    title: "이번 주말 부산 가는데 현지인 친구들 추천 리스트 부탁",
    thumbnailImageUrl: null,
    likeCount: 41,
    commentCount: 5,
    dateLabel: "26.04.28",
    postType: "FREE",
  },
  {
    id: 910511,
    title: "아침에 갓 구운 크루와상 향 때문에 하루가 산다는 분",
    thumbnailImageUrl: null,
    likeCount: 76,
    commentCount: 8,
    dateLabel: "26.04.27",
    postType: "FREE",
  },
  {
    id: 910512,
    title: "빵 종류 따라 마실 거 페어링 차 vs 커피 취향 정리본",
    thumbnailImageUrl: null,
    likeCount: 53,
    commentCount: 14,
    dateLabel: "26.04.26",
    postType: "FREE",
  },
];

export const MOCK_BBANGTICLE_BOARD_ITEMS: BbangteoBoardListRow[] = [
  {
    id: 920101,
    title: "[공지] 앱 업데이트 및 정기 점검 안내 (5월)",
    thumbnailImageUrl: null,
    likeCount: 0,
    commentCount: 8,
    dateLabel: "26.05.08",
    postType: "NOTICE",
  },
  {
    id: 920201,
    title: "[빵티클] 성심당 한 번에 정복하기: 웨이팅·메뉴·포장 노하우",
    thumbnailImageUrl: null,
    likeCount: 356,
    commentCount: 14,
    dateLabel: "26.05.07",
    postType: "ARTICLE",
  },
  {
    id: 920102,
    title: "[공지] 커뮤니티 운영 규칙 개정 안내",
    thumbnailImageUrl: null,
    likeCount: 12,
    commentCount: 5,
    dateLabel: "26.05.05",
    postType: "NOTICE",
  },
  {
    id: 920202,
    title: "[빵티클] 전국 단팥빵 맛집 5선 — 쌀알 단팥부터 바삭 크림까지",
    thumbnailImageUrl: null,
    likeCount: 198,
    commentCount: 11,
    dateLabel: "26.05.04",
    postType: "ARTICLE",
  },
  {
    id: 920203,
    title: "[빵티클] 홈베이킹 시작할 때 장비부터 반죽 온도까지",
    thumbnailImageUrl: null,
    likeCount: 145,
    commentCount: 17,
    dateLabel: "26.05.02",
    postType: "ARTICLE",
  },
  {
    id: 920103,
    title: "[공지] 이벤트 당첨자 안내 및 개인정보 수집 동의 재확인",
    thumbnailImageUrl: null,
    likeCount: 24,
    commentCount: 3,
    dateLabel: "26.04.30",
    postType: "NOTICE",
  },
  {
    id: 920204,
    title: "[빵티클] 크루와상 접는 법 GIF로 따라하기 (초보도 가능)",
    thumbnailImageUrl: null,
    likeCount: 267,
    commentCount: 9,
    dateLabel: "26.04.28",
    postType: "ARTICLE",
  },
  {
    id: 920205,
    title: "[빵티클] 제철 과일 타르트, 실패 없이 굽는 법",
    thumbnailImageUrl: null,
    likeCount: 89,
    commentCount: 18,
    dateLabel: "26.04.26",
    postType: "ARTICLE",
  },
  {
    id: 920104,
    title: "[공지] 서비스 이용 약관 일부 개정 (시행 5/15)",
    thumbnailImageUrl: null,
    likeCount: 7,
    commentCount: 2,
    dateLabel: "26.04.25",
    postType: "NOTICE",
  },
  {
    id: 920206,
    title: "[빵티클] 동네 오븐집 찾는 법 — 냄새·진열·시간대 체크리스트",
    thumbnailImageUrl: null,
    likeCount: 133,
    commentCount: 13,
    dateLabel: "26.04.22",
    postType: "ARTICLE",
  },
  {
    id: 920207,
    title: "[빵티클] 비건 베이커리 입문: 대체 버터·달걀 활용법",
    thumbnailImageUrl: null,
    likeCount: 71,
    commentCount: 14,
    dateLabel: "26.04.20",
    postType: "ARTICLE",
  },
  {
    id: 920208,
    title: "[빵티클] 설령 카페 투어 루트 — 아침·점심·디저트 한 번에",
    thumbnailImageUrl: null,
    likeCount: 182,
    commentCount: 12,
    dateLabel: "26.04.18",
    postType: "ARTICLE",
  },
];

export type BbangteoHomePostPreview = { content: string; date: string };

export const MOCK_HOME_FREE_PREVIEWS: BbangteoHomePostPreview[] = MOCK_FREE_BOARD_ITEMS.slice(
  0,
  6,
).map((row) => ({ content: row.title, date: row.dateLabel }));

export const MOCK_HOME_BBANGTICLE_PREVIEWS: BbangteoHomePostPreview[] =
  MOCK_BBANGTICLE_BOARD_ITEMS.slice(0, 6).map((row) => ({
    content: row.title,
    date: row.dateLabel,
  }));

/** mock: env true → 사용, env false → 끔, 미설정 → DEV에서만 mock. */
export function shouldUseBoardMock(): boolean {
  const flag = import.meta.env.VITE_USE_BOARD_MOCK;
  if (flag === "true") {
    return true;
  }
  if (flag === "false") {
    return false;
  }
  return import.meta.env.DEV;
}

export function getMockBoardSource(tab: "자유 게시판" | "빵티클"): BbangteoBoardListRow[] {
  const src = tab === "자유 게시판" ? MOCK_FREE_BOARD_ITEMS : MOCK_BBANGTICLE_BOARD_ITEMS;
  return src.map((r) => ({ ...r, commentCount: clampMockCommentCount(r.commentCount) }));
}

function yyMmDdLabelToIso(label: string): string {
  const m = /^(\d{2})\.(\d{2})\.(\d{2})$/.exec(label.trim());
  if (!m) {
    return new Date().toISOString();
  }
  const yy = Number.parseInt(m[1], 10);
  const mm = Number.parseInt(m[2], 10);
  const dd = Number.parseInt(m[3], 10);
  const year = 2000 + yy;
  const d = new Date(year, mm - 1, dd, 14, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

const MOCK_COMMENT_BLURBS = [
  "공감합니다!",
  "저도 같은 생각이에요 ㅋㅋ",
  "좋은 정보 감사해요.",
  "다음에 같이 다녀요~",
  "사진도 올려주시면 참고할게요.",
  "저는 냉동으로 보관해요.",
  "성심당은 진짜 웨이팅 길더라구요.",
  "단골인데 분위기 요즘 달라졌어요 ㅠ",
  "맛있게 드세요~",
];

const MOCK_NICKS = ["단팥빵조아", "크루조아", "소금빵덕후", "아침빵", "호두파이"];

function buildMockCommentsForPost(
  postId: number,
  commentCount: number,
  postIso: string,
): CommentItem[] {
  const n = clampMockCommentCount(commentCount);
  const postMs = new Date(postIso).getTime();
  const rows: CommentItem[] = [];
  for (let i = 0; i < n; i++) {
    const createdAt = new Date(postMs + (i + 1) * 600_000).toISOString();
    rows.push({
      id: postId * 100 + i + 1,
      nickname: MOCK_NICKS[i % MOCK_NICKS.length],
      profileImageUrl: null,
      content: MOCK_COMMENT_BLURBS[i % MOCK_COMMENT_BLURBS.length],
      createdAt,
      author: false,
    });
  }
  return rows;
}

function buildMockBoardPostDetail(
  row: BbangteoBoardListRow,
  nickname: string,
  body: string,
  withComments: boolean,
): PostDetail {
  const createdAt = yyMmDdLabelToIso(row.dateLabel);
  if (!withComments) {
    return {
      id: row.id,
      title: row.title,
      nickname,
      profileImageUrl: null,
      createdAt,
      content: `${row.title}\n\n${body}`,
      imageUrls: [],
      liked: false,
      likeCount: row.likeCount,
      author: false,
      commentListResponse: { comments: [], total: 0 },
    };
  }
  const commentTotal = clampMockCommentCount(row.commentCount);
  const comments = buildMockCommentsForPost(row.id, commentTotal, createdAt);
  return {
    id: row.id,
    title: row.title,
    nickname,
    profileImageUrl: null,
    createdAt,
    content: `${row.title}\n\n${body}`,
    imageUrls: [],
    liked: false,
    likeCount: row.likeCount,
    author: false,
    commentListResponse: {
      comments,
      total: commentTotal,
    },
  };
}

/** 자유 게시판 Mock 목록에 해당하는 게시글의 로컬 상세 (실 API에 id가 없어도 표시 가능) */
export function getMockFreeBoardPostDetail(postId: number): PostDetail | null {
  const row = MOCK_FREE_BOARD_ITEMS.find((r) => r.id === postId);
  if (!row) {
    return null;
  }
  return buildMockBoardPostDetail(
    row,
    "빵테리안",
    "직접 겪어본 이야기라 공유합니다. 비슷한 경험이 있으면 댓글로 알려 주세요.",
    true,
  );
}

export function isMockFreeBoardPostId(postId: number): boolean {
  return MOCK_FREE_BOARD_ITEMS.some((r) => r.id === postId);
}

/** 빵티클(공지·에디터 글) Mock 목록 로컬 상세 */
export function getMockBbangticleBoardPostDetail(postId: number): PostDetail | null {
  const row = MOCK_BBANGTICLE_BOARD_ITEMS.find((r) => r.id === postId);
  if (!row) {
    return null;
  }
  const nickname = row.postType === "NOTICE" ? "빵빵 공지" : "빵티클 에디터";
  const body =
    row.postType === "NOTICE"
      ? "서비스 운영과 관련한 안내입니다. 문의 사항은 고객센터로 연락 주세요."
      : "빵과 베이커리를 주제로 한 에디터 콘텐츠입니다.";
  return buildMockBoardPostDetail(row, nickname, body, false);
}

export function isMockBbangticleBoardPostId(postId: number): boolean {
  return MOCK_BBANGTICLE_BOARD_ITEMS.some((r) => r.id === postId);
}
