import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";

type Post = {
  author: string;
  date: string;
  time: string;
  title: string;
  content: string;
  likeCount: number;
  images: string[];
};

const bbangticlePost: Post = {
  author: "빵빵 관리자",
  date: "2026.04.29",
  time: "15:24",
  title: "빵터 업데이트: 이제 내 주변 빵집을 지도로 확인하세요!",
  content:
    "안녕하세요, 빵지순례의 든든한 동반자 빵빵입니다! 🥐\n많은 분이 기다려주셨던 '빵터 지도 뷰' 기능이 드디어 업데이트되었습니다! 이제 리스트로만 보던 빵집 정보를 내 주변 지도를 통해 한눈에 확인해 보세요.\n\n✨ 이번 업데이트의 핵심 포인트!\n내 주변 빵집 스캔: 내 현재 위치를 중심으로 가장 가까운 빵집들을 지도에서 바로 찾을 수 있어요.\n실시간 품절 현황 반영: 지도의 핀(Pin) 색상만 봐도 지금 빵이 남아있는지, 품절인지 직관적으로 알 수 있습니다.\n에이전트 동선 연동: 지도를 보다가 맘에 드는 곳을 발견하면? 내 기존 투어 루트에 '즉시 추가'하고 AI에게 최적의 동선을 다시 계산해달라고 요청해 보세요!\n\n지금 바로 '빵터' 탭에서 새로운 지도를 경험해 보세요! 📍✨",
  likeCount: 11,
  images: [
    "Frame 473651_2874.png",
    "Frame 17074825803651_2876.png",
    "Frame 17074825813651_2878.png",
    "Frame 17074825823651_2880.png",
  ],
};

const CircleIcon = ({ size = 24, color = "#dcdee3" }: { size?: number; color?: string }) => (
  <div className="rounded-full" style={{ width: size, height: size, backgroundColor: color }} />
);

const BackHeader = () => {
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 left-1/2 z-40 flex h-[56px] w-full max-w-[402px] -translate-x-1/2 items-center justify-between border-b border-[#eeeff1] bg-white px-[20px] md:max-w-[744px]">
      <button
        type="button"
        className="flex h-[36px] w-[36px] items-center justify-center"
        onClick={() => navigate({ to: "/bbangteo-article-board" })}
      >
        <img src={ArrowLeft} alt="뒤로가기" className="h-[24px] w-[24px]" />
      </button>
      <div className="h-[36px] w-[36px]" />
    </header>
  );
};

const ProfileAvatar = () => (
  <div className="h-[40px] w-[40px] shrink-0 rounded-full border border-[#eeeff1] bg-[#f7f8f9]" />
);

const DateTimeText = ({ date, time }: { date: string; time: string }) => (
  <div className="flex items-start gap-[6px]">
    <span className="whitespace-nowrap text-[12px] leading-[16px] text-[#868b94]">{date}</span>
    <span className="whitespace-nowrap text-[12px] leading-[16px] text-[#868b94]">{time}</span>
  </div>
);

const AuthorInfo = ({ author, date, time }: { author: string; date: string; time: string }) => (
  <div className="flex h-[40px] items-center gap-[10px]">
    <ProfileAvatar />
    <div className="flex flex-1 flex-col gap-[2px]">
      <div className="whitespace-nowrap text-[13px] leading-[18px] font-bold text-[#1a1c20]">
        {author}
      </div>
      <DateTimeText date={date} time={time} />
    </div>
  </div>
);

const ImageRow = ({ images }: { images: string[] }) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="flex h-[110px] items-center gap-[6px] overflow-x-auto">
      {images.map((image, index) => (
        <div
          key={`${image}-${index}`}
          className="flex h-[110px] w-[110px] shrink-0 items-center justify-center rounded-[8px] bg-[#f3f4f5]"
        >
          <img
            src={currationBreadImg}
            alt={`게시글 이미지 ${index + 1}`}
            className="h-[31px] w-[32px] object-contain"
          />
        </div>
      ))}
    </div>
  );
};

const PostActionBar = ({ likeCount }: { likeCount: number }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        className="flex items-center gap-[2px]"
        onClick={() => navigate({ to: "/bbangteo-article-board" })}
      >
        <CircleIcon />
        <span className="text-[14px] leading-[19px] text-[#1a1c20]">목록으로</span>
      </button>

      <button type="button" className="flex items-center gap-[2px]">
        <CircleIcon />
        <span className="text-[14px] leading-[19px] text-[#1a1c20]">{likeCount}</span>
      </button>
    </div>
  );
};

const PostDetail = ({ post }: { post: Post }) => (
  <section className="flex flex-col gap-[24px] bg-white p-[20px]">
    <AuthorInfo author={post.author} date={post.date} time={post.time} />
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[10px]">
        <h1 className="text-[18px] leading-[24px] font-bold text-[#1a1c20]">{post.title}</h1>
        <p className="whitespace-pre-line text-[16px] leading-[22px] text-[#1a1c20]">
          {post.content}
        </p>
      </div>
      <ImageRow images={post.images} />
    </div>
    <PostActionBar likeCount={post.likeCount} />
  </section>
);

const BbangticlePostDetailPage = () => {
  return (
    <MobileFrame className="bg-[#f3f4f5]">
      <div className="flex min-h-screen flex-1 flex-col bg-[#f3f4f5]">
        <BackHeader />
        <main className="flex flex-1 flex-col pb-[56px] pt-[56px] sm:pb-[60px]">
          <PostDetail post={bbangticlePost} />
        </main>
      </div>
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangticlePostDetailPage;
