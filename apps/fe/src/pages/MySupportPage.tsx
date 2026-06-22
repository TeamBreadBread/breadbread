import { useNavigate } from "@tanstack/react-router";
import { AppTopBar, ToastBanner } from "@/components/common";
import FaqAccordionItem from "@/components/domain/my/FaqAccordionItem";
import MyMenuItem from "@/components/domain/my/MyMenuItem";
import { IconAssets } from "@/components/icons";
import { useComingSoonToast } from "@/hooks/useComingSoonToast";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";

const FAQ_ITEMS = [
  {
    question: "빵택시는 실제 택시인가요?",
    answer: "빵택시는 현재 빵투어 코스 예약/안내 기능이며, 실제 택시 호출 서비스는 아닙니다.",
  },
  {
    question: "빵집 정보가 틀렸어요.",
    answer: "빵집 정보가 틀렸다면 빵집 제보 또는 수정 요청을 통해 알려주세요.",
  },
  {
    question: "코스 추천이 이상해요.",
    answer:
      "코스 추천은 선호도, 현재 위치, 영업 여부, 혼잡도 데이터를 기준으로 제공되며 실제 상황과 다를 수 있습니다.",
  },
  {
    question: "예약한 빵투어는 어디서 확인하나요?",
    answer: "예약한 빵투어는 마이페이지 또는 진행 중인 코스 화면에서 확인할 수 있습니다.",
  },
] as const;

export default function MySupportPage() {
  const navigate = useNavigate();
  const { toastMessage, showComingSoon } = useComingSoonToast();

  return (
    <MobileFrame>
      <div className="relative flex flex-1 flex-col bg-[#f3f4f5] dark:bg-[#14181c]">
        <AppTopBar title="고객센터" onBack={() => navigate({ to: "/my" })} />

        <div className="flex flex-1 flex-col gap-[10px] pb-[calc(56px+24px)] sm:pb-[calc(72px+24px)]">
          <div className="bg-white px-x5 py-x5 dark:bg-[#1f2429]">
            <p className="font-pretendard typo-t4regular leading-relaxed text-[#555d6d] dark:text-gray-300">
              궁금한 점이나 불편한 점이 있으신가요?
              <br />
              빵빵 팀이 확인 후 도와드릴게요.
            </p>
          </div>

          <section className="w-full">
            <div className="bg-[#f3f4f5] px-x5 py-x3 dark:bg-[#14181c]">
              <h2 className="font-pretendard typo-t4bold text-[#1a1c20] dark:text-gray-100">
                문의하기
              </h2>
            </div>
            <MyMenuItem
              label="이메일 문의하기"
              iconSrc={IconAssets.IcSend}
              onClick={() => showComingSoon("이메일 문의 기능은 준비 중이에요.")}
            />
            <MyMenuItem
              label="빵집 제보하기"
              iconSrc={IconAssets.IcWrite}
              onClick={() => navigate({ to: "/bbangteo-bakery-suggest" })}
            />
            <MyMenuItem
              label="공지사항 보기"
              iconSrc={IconAssets.IcNoticeCircle}
              onClick={() => showComingSoon("공지사항 페이지는 준비 중이에요.")}
            />
          </section>

          <section className="w-full">
            <div className="bg-[#f3f4f5] px-x5 py-x3 dark:bg-[#14181c]">
              <h2 className="font-pretendard typo-t4bold text-[#1a1c20] dark:text-gray-100">
                자주 묻는 질문
              </h2>
              <p className="mt-x0.5 font-pretendard typo-t3regular text-[#868b94] dark:text-gray-400">
                궁금한 내용을 빠르게 확인해 보세요.
              </p>
            </div>
            {FAQ_ITEMS.map((item) => (
              <FaqAccordionItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </section>
        </div>

        {toastMessage ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-[calc(56px+16px)] z-[120] mx-auto max-w-[402px] px-x4">
            <ToastBanner message={toastMessage} />
          </div>
        ) : null}
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
