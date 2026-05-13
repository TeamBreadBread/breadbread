import type { CommentResponse, PostDetail, PostSummary, PostType } from "@/api/posts";

/** 빵터 홈 — 자유 게시판 미리보기(목록)과 동일 문구 */
export const BBANGTEO_HOME_FREE_POST_ITEMS = [
  { content: "방금 갓 나온 베이글 먹었는데 진짜 대박", date: "26.04.27" },
  { content: "빵순이가 알려주는 주말 성심당 웨이팅 꿀팁.txt", date: "26.04.27" },
  { content: "빵 보관 어떻게들 하세요? 냉동 vs 냉장", date: "26.04.27" },
  { content: "다이어트 중인데 빵 못 참겠어요.. 정상이겠죠?", date: "26.04.27" },
  { content: "연남동 근처에 카공하기 좋은 베이커리 카페 추천 좀!", date: "26.04.27" },
] as const;

/** 빵터 홈 — 빵빵 소식 미리보기(목록)과 동일 문구 */
export const BBANGTEO_HOME_NEWS_POST_ITEMS = [
  { content: "[공지] 이번 주 정기 점검 안내", date: "26.04.27" },
  { content: "[빵티클] 대전 성심당 정복 가이드", date: "26.04.27" },
  { content: "[공지] 이번 주 정기 점검 안내", date: "26.04.27" },
  { content: "[빵티클] 대전 성심당 정복 가이드", date: "26.04.27" },
  { content: "[공지] 이번 주 정기 점검 안내", date: "26.04.27" },
] as const;

const MOCK_FREE_ID_BASE = -1000;
const MOCK_NEWS_ID_BASE = -2000;

function shortDateToCreatedAtIso(short: string): string {
  const parts = short.split(".");
  if (parts.length !== 3) return "2026-04-27T00:00:00.000Z";
  const yy = Number(parts[0]);
  const mm = Number(parts[1]);
  const dd = Number(parts[2]);
  const y = Number.isFinite(yy) && yy < 100 ? 2000 + yy : yy;
  const m = Number.isFinite(mm) ? mm : 1;
  const d = Number.isFinite(dd) ? dd : 1;
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString();
}

const FREE_META = [
  { likeCount: 12, commentCount: 3 },
  { likeCount: 28, commentCount: 7 },
  { likeCount: 9, commentCount: 14 },
  { likeCount: 41, commentCount: 2 },
  { likeCount: 6, commentCount: 5 },
] as const;

const NEWS_META = [
  { likeCount: 4, commentCount: 0 },
  { likeCount: 52, commentCount: 0 },
  { likeCount: 3, commentCount: 0 },
  { likeCount: 48, commentCount: 0 },
  { likeCount: 2, commentCount: 0 },
] as const;

export function isBbangteoMockPostId(id: number): boolean {
  return id < 0;
}

export function getMockFreeBoardSummaries(): PostSummary[] {
  return BBANGTEO_HOME_FREE_POST_ITEMS.map((row, i) => ({
    id: MOCK_FREE_ID_BASE - i,
    title: row.content,
    postType: "FREE" satisfies PostType,
    likeCount: FREE_META[i % FREE_META.length].likeCount,
    commentCount: FREE_META[i % FREE_META.length].commentCount,
    thumbnailImageUrl: null,
    createdAt: shortDateToCreatedAtIso(row.date),
  }));
}

export function getMockArticleBoardSummaries(): PostSummary[] {
  return BBANGTEO_HOME_NEWS_POST_ITEMS.map((row, i) => {
    const isNotice = row.content.startsWith("[공지]");
    return {
      id: MOCK_NEWS_ID_BASE - i,
      title: row.content,
      postType: (isNotice ? "NOTICE" : "ARTICLE") satisfies PostType,
      likeCount: NEWS_META[i % NEWS_META.length].likeCount,
      commentCount: NEWS_META[i % NEWS_META.length].commentCount,
      thumbnailImageUrl: null,
      createdAt: shortDateToCreatedAtIso(row.date),
    };
  });
}

const MOCK_COMMENT_NICKS = [
  "한강뷰식빵",
  "오후의크림",
  "단팥호빵러",
  "연남동빵순이",
  "새벽줄서기",
  "버터한스쿱",
  "소금빵중독",
  "대전출근러",
  "냉동실지박령",
  "다이어트는내일",
  "카페인빵",
  "오븐옆고양이",
  "성심당로컬",
  "베이글덕후",
  "크림가득",
] as const;

/** 자유게시판 톤 — 제목과 무관하게도 어울리는 커뮤니티 댓글 */
const MOCK_FREE_COMMENT_LINES = [
  "저도 어제 비슷한 거 먹었는데 겉은 바삭하고 속은 쫀득해서 한 판 더 사왔어요 ㅋㅋ",
  "베이글은 꼭 데워 먹으세요. 인생 바뀝니다.",
  "어디 브랜드예요? 다음 주말에 가보려고요.",
  "사진만 봐도 냄새 날 것 같아요… 부럽",
  "전 냉동실에 넣어두고 아침에 토스터기 돌려요. 냉장보다 오래 가요.",
  "냉장은 수분 날아가서 금방 딱딱해지더라고요. 냉동 추천이요.",
  "성심당은 주말에 진짜 미친 줄… 그래도 한 번은 가볼 만해요.",
  "일찍 가면 웨이팅 덜한 편이에요. 오픈런 각오하고요.",
  "다이어트 중에도 가끔은 먹어줘야 정신 건강에 좋다고… 저는 그렇게 믿어요",
  "빵 끊는 게 제일 어려워요. 화이팅…",
  "연남 쪽이면 홍대역에서 걸어서 10분 안쪽 카페들 많아요. 창가 자리 있는 데 찾아보세요.",
  "카공은 콘센트·와이파이 있는지 미리 보고 가는 게 편해요.",
  "추천 감사해요 저장해뒀어요 🙏",
  "글 잘 봤습니다! 공유 고마워요",
  "저도 궁금했는데 댓글 보고 도움 됐어요",
  "크림 많이 들어간 거 좋아하시면 페스츄리류도 한번 드셔보세요",
  "소금빵은 그날 먹는 게 제일 맛있어요. 다음 날은 에어프라이어 추천",
  "식빵은 슬라이스해서 냉동하면 토스트하기 좋아요",
  "가루가루 떨어지는 빵은 지퍼백에 넣어두면 덜 마르더라고요",
  "빵 살 때 영수증 챙기면 적립되는 곳도 있으니 한번 확인해 보세요",
  "오늘 저녁은 또 빵이네요… 인정합니다",
  "말린 크루아상은 우유에 찍어 먹으면 살아나요",
  "알바 해본 사람으로서 새벽 배치 나오는 빵이 진짜 맛있긴 해요",
  "가게 앞에서 냄새 맡다가 못 참고 들어간 적 있어요 ㅋㅋ",
  "배고플 때 이 글 보면 안 되는데 또 들어왔네",
  "저는 무조건 단팥빵 파인데 요즘 소금빵에 빠졌어요",
  "친구한테 링크 보냈어요. 같이 가기로 함",
  "댓글들 보니까 빵순이들 많다… 반가워요",
  "다음에 후기도 올려주세요 기다릴게요",
  "사진 첨부해 주시면 더 고맙겠어요!",
  "가격대는 어느 정도였어요?",
  "줄 서는 시간 대략 얼마나 걸렸는지 알려주실 수 있나요?",
  "주차는 근처 공영주차장 이용하셨어요?",
  "아이랑 같이 가도 괜찮을까요?",
  "포장용기 따로 챙겨 가야 하나요?",
] as const;

/** 공지·빵티클 톤 */
const MOCK_NEWS_COMMENT_LINES = [
  "점검 시간대만 알려주시면 앱 쓸 때 참고할게요. 감사합니다!",
  "운영진 수고 많으세요 🙇",
  "공지 잘 읽었습니다.",
  "점검 후에도 결제 오류 없는지 한번만 더 확인 부탁드려요.",
  "대전 가고 싶었는데 글 보고 더 가고 싶어졌어요 ㅋㅋ",
  "성심당 튀김소보로 진짜 레전드죠. 가이드대로 둘러보고 왔는데 만족",
  "현지인 팁 너무 좋아요. 케이크류는 어디가 제일인가요?",
  "주말에 다녀왔는데 줄 길긴 한데 기다릴 만했어요.",
  "기차 시간 맞춰 가려면 몇 시쯤 도착하는 게 좋을까요?",
  "빵티클 자주 올려주세요 재밌게 잘 봤습니다",
  "사진 퀄리티 미쳤다… 저장",
  "다음 편도 기다릴게요!",
  "공지 덕분에 미리 알았네요 감사해요",
  "점검 중에도 읽기만 되는지 궁금해요",
  "앱 업데이트는 자동으로 되나요?",
  "긴 글인데도 읽기 편하게 잘 정리돼 있어요",
  "친구한테 공유했어요. 여행 계획 짤 때 도움 될 듯",
  "대전 사는 친구한테 보냈더니 현지 맛집 더 알려준대요 ㅋㅋ",
  "빵순이 인증합니다 이 글 퀄리티 👍",
  "목차 있으면 더 좋을 것 같아요 (개인 의견)",
  "표로 정리된 부분 보기 좋았어요",
  "다른 지역 가이드도 부탁드려요",
  "작성자님 글 항상 잘 보고 있어요",
  "링크 타고 들어왔는데 유익했습니다",
] as const;

function buildMockComments(
  postId: number,
  postCreatedAtIso: string,
  count: number,
  kind: "free" | "news",
): CommentResponse[] {
  if (count <= 0) return [];
  const t0 = new Date(postCreatedAtIso).getTime();
  const baseId = postId * 1000;
  const pool = kind === "free" ? MOCK_FREE_COMMENT_LINES : MOCK_NEWS_COMMENT_LINES;
  return Array.from({ length: count }, (_, i) => {
    const nick = MOCK_COMMENT_NICKS[(Math.abs(postId) + i * 3) % MOCK_COMMENT_NICKS.length];
    const line = pool[(Math.abs(postId) * 11 + i * 13) % pool.length];
    return {
      id: baseId - i - 1,
      nickname: nick,
      profileImageUrl: null,
      content: line,
      createdAt: new Date(t0 + (i + 1) * 60_000).toISOString(),
      isAuthor: false,
    };
  });
}

function summaryToDetail(summary: PostSummary): PostDetail {
  const kind: "free" | "news" = summary.postType === "FREE" ? "free" : "news";
  const comments = buildMockComments(summary.id, summary.createdAt, summary.commentCount, kind);
  return {
    id: summary.id,
    title: summary.title,
    nickname: "빵터",
    profileImageUrl: null,
    createdAt: summary.createdAt,
    content:
      "빵터 홈에 표시되는 미리보기와 같은 제목의 데모 게시글입니다.\n\n실제 서버에 저장된 글이 아니며, 목록·상세 UI 확인용입니다.",
    imageUrls: [],
    liked: false,
    isAuthor: false,
    likeCount: summary.likeCount,
    commentListResponse: {
      comments,
      total: comments.length,
    },
  };
}

export function getMockPostDetailById(id: number): PostDetail | null {
  const free = getMockFreeBoardSummaries().find((p) => p.id === id);
  if (free) return summaryToDetail(free);
  const news = getMockArticleBoardSummaries().find((p) => p.id === id);
  if (news) return summaryToDetail(news);
  return null;
}
