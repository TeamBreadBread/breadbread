import { useRegisterSW } from "virtual:pwa-register/react";

/** 배포 후 새 sw.js 감지 주기 (탭을 켜둔 채로도 업데이트를 알 수 있도록) */
const SW_UPDATE_CHECK_INTERVAL_MS = 60_000;

/**
 * 새 버전 배포 감지 시 "새 업데이트가 있습니다" 팝업을 띄우고,
 * 사용자가 누르면 새 서비스워커로 교체 후 페이지를 새로고침한다.
 * (vite-plugin-pwa registerType: "prompt" 와 한 세트)
 */
export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      // 주기적으로 + 탭 복귀 시 새 버전 확인
      setInterval(() => {
        void registration.update().catch(() => undefined);
      }, SW_UPDATE_CHECK_INTERVAL_MS);

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          void registration.update().catch(() => undefined);
        }
      });
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] mx-auto w-full max-w-[402px] px-x4 pb-[calc(56px+12px)] sm:pb-[calc(60px+12px)]">
      <div
        role="alertdialog"
        aria-label="새 업데이트 알림"
        className="pointer-events-auto flex items-center gap-x3 rounded-r4 bg-gray-100 px-x4 py-x3 shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
      >
        <p className="min-w-0 flex-1 font-pretendard text-size-3 leading-t5 text-gray-1000">
          새 업데이트가 있습니다!
          <br />
          <span className="text-gray-600">새로고침하면 최신 버전이 적용돼요.</span>
        </p>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="shrink-0 rounded-r2 px-x2 py-x2 font-pretendard text-size-3 text-gray-600 transition-colors hover:text-gray-900"
        >
          나중에
        </button>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="shrink-0 rounded-r2 bg-orange-600 px-x4 py-x2 font-pretendard text-size-3 font-bold text-gray-00 transition-colors hover:bg-orange-700"
        >
          업데이트
        </button>
      </div>
    </div>
  );
}
