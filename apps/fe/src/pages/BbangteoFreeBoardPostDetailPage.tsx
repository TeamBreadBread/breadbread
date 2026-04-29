import { type PointerEvent, useRef } from "react";
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

type Comment = {
  id: number;
  author: string;
  content: string;
  date: string;
  time: string;
};

const post: Post = {
  author: "노릇노릇한 소금빵",
  date: "2026.04.29",
  time: "15:24",
  title: "방금 갓 나온 베이글 먹었는데 진짜 대박",
  content:
    "대전 빵지순례 2일차인데 드디어 성공했어요! ㅠㅠ 사실 아까 성심당 갔다가 튀소 품절이라 멘붕 왔었거든요...\n근데 마침 추천 리스트에 여기 베이글 지금 갓 나왔다고 떠서 바로 달려왔더니 진짜 운 좋게 세이프!\n\n지금 베이글 결이 장난 아니에요. 따끈따끈해서 입안에서 녹네요. 혹시 지금 근처 계신 분들 있으면 여기부터 들르세요! 한 10분 뒤면 품절될 것 같은 분위기예요.",
  likeCount: 11,
  images: [
    "Frame 473651_2811.png",
    "Frame 17074825803651_2813.png",
    "Frame 17074825813651_2815.png",
    "Frame 17074825823651_2817.png",
  ],
};

const comments: Comment[] = [
  {
    id: 1,
    author: "바삭바삭한 휘낭시에",
    content: "헐.. 너무 부러워... 저도 담에 꼭 가야겠어요 공유 감사합니다!!!",
    date: "2026.04.29",
    time: "15:24",
  },
  {
    id: 2,
    author: "바삭바삭한 휘낭시에",
    content: "헐.. 너무 부러워... 저도 담에 꼭 가야겠어요 공유 감사합니다!!!",
    date: "2026.04.29",
    time: "15:24",
  },
];

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
        onClick={() => navigate({ to: "/bbangteo-board" })}
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
      <div className="text-[13px] leading-[18px] font-bold text-[#1a1c20]">{author}</div>
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
        onClick={() => navigate({ to: "/bbangteo-board" })}
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

const CommentItem = ({ comment }: { comment: Comment }) => (
  <article className="flex min-h-[80px] items-start gap-[10px]">
    <ProfileAvatar />
    <div className="flex flex-1 flex-col gap-[4px]">
      <div className="text-[13px] leading-[18px] font-bold text-[#1a1c20]">{comment.author}</div>
      <p className="text-[14px] leading-[19px] text-[#1a1c20]">{comment.content}</p>
      <DateTimeText date={comment.date} time={comment.time} />
    </div>
  </article>
);

const CommentList = ({ comments }: { comments: Comment[] }) => (
  <div className="flex flex-col gap-[20px]">
    {comments.map((comment) => (
      <CommentItem key={comment.id} comment={comment} />
    ))}
  </div>
);

const CommentSection = ({ comments }: { comments: Comment[] }) => (
  <section className="flex flex-col gap-[24px] bg-white p-[20px]">
    <div className="flex items-center gap-[4px]">
      <span className="text-[13px] leading-[18px] font-bold text-[#555d6d]">댓글</span>
      <span className="text-[13px] leading-[18px] font-medium text-[#555d6d]">
        {comments.length}
      </span>
    </div>
    <CommentList comments={comments} />
  </section>
);

const CommentInputBar = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusCommentInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.focus({ preventScroll: false });
  };

  const handleBarPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button[data-comment-submit]")) return;
    focusCommentInput();
  };

  return (
    <div
      className="fixed bottom-[56px] left-1/2 z-[49] w-full max-w-[402px] -translate-x-1/2 border-t border-[#eeeff1] bg-white px-[20px] py-[10px] md:bottom-[60px] md:max-w-[744px]"
      style={{ touchAction: "manipulation" as const }}
    >
      <div
        className="flex h-[44px] cursor-text items-center gap-[8px] rounded-[9999px] bg-[#f3f4f5] px-[14px]"
        onPointerDown={handleBarPointerDown}
        role="presentation"
      >
        <input
          ref={inputRef}
          type="text"
          name="free-board-comment"
          inputMode="text"
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="sentences"
          placeholder="댓글을 입력해주세요"
          className="min-h-[44px] min-w-0 flex-1 touch-manipulation bg-transparent text-[16px] leading-[22px] text-[#1a1c20] placeholder:text-[#868b94] outline-none"
          onFocus={(event) => {
            requestAnimationFrame(() => {
              event.target.scrollIntoView({ block: "center", behavior: "smooth" });
            });
          }}
        />
        <button
          type="button"
          data-comment-submit
          className="shrink-0 text-[13px] leading-[18px] font-medium text-[#555d6d]"
        >
          등록
        </button>
      </div>
    </div>
  );
};

const FreeBoardPostDetailPage = () => {
  return (
    <MobileFrame className="bg-[#f3f4f5]">
      <div className="flex min-h-screen flex-1 flex-col bg-[#f3f4f5]">
        <BackHeader />
        <main className="flex flex-1 flex-col gap-[10px] pb-[calc(56px+64px)] pt-[56px] sm:pb-[calc(60px+64px)]">
          <PostDetail post={post} />
          <CommentSection comments={comments} />
        </main>
      </div>
      <CommentInputBar />
      <BottomNav />
    </MobileFrame>
  );
};

export default FreeBoardPostDetailPage;
