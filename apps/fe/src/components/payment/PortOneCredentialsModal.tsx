import { useState } from "react";
import { getPortOneBrowserOverrides, setPortOneBrowserOverrides } from "@/lib/portoneSettings";

type PortOneCredentialsModalProps = {
  open: boolean;
  onClose: () => void;
};

function PortOneCredentialsForm({ onClose }: { onClose: () => void }) {
  const initial = getPortOneBrowserOverrides();
  const [storeId, setStoreId] = useState(initial.storeId);
  const [channelKey, setChannelKey] = useState(initial.channelKey);

  return (
    <div className="w-full max-w-[400px] rounded-t-[16px] bg-white p-[20px] shadow-xl sm:rounded-[16px]">
      <h2
        id="portone-settings-title"
        className="text-[17px] font-bold leading-[24px] text-[#1a1c20]"
      >
        포트원 연동 값 (브라우저)
      </h2>
      <p className="mt-[8px] text-[13px] leading-[18px] text-[#868b94]">
        <code className="rounded bg-[#f3f4f5] px-[4px] text-[12px]">apps/fe/.env.local</code>의{" "}
        <code className="rounded bg-[#f3f4f5] px-[4px] text-[12px]">VITE_PORTONE_STORE_ID</code>·
        <code className="rounded bg-[#f3f4f5] px-[4px] text-[12px]">VITE_PORTONE_CHANNEL_KEY</code>
        가 있으면 항상 그 값이 우선합니다. 여기 입력값은 env·서버 설정이 비어 있을 때만 쓰이며, 저장
        시 이 브라우저에만 보관됩니다.
      </p>
      <p className="mt-[6px] text-[13px] leading-[18px] text-[#868b94]">
        API Secret은 프론트에 넣지 마세요. 서버 환경 변수{" "}
        <code className="rounded bg-[#f3f4f5] px-[4px] text-[12px]">PORTONE_API_SECRET</code>에
        설정합니다.
      </p>
      <p className="mt-[10px] rounded-[8px] bg-[#f7f8f9] px-[12px] py-[10px] text-[12px] leading-[17px] text-[#555d6d]">
        아래 회색 글자는 <span className="font-medium text-[#2a3038]">입력 예시·안내</span>입니다.
        포트원 관리자 콘솔에서 복사한 실제 Store ID·채널 키를 붙여 넣은 뒤 「저장」을 누르세요.
      </p>

      <label className="mt-[16px] block text-[13px] font-medium text-[#555d6d]" htmlFor="p1-store">
        Store ID
      </label>
      <input
        id="p1-store"
        className="mt-[6px] w-full rounded-[8px] border border-[#eeeff1] px-[12px] py-[10px] text-[15px] outline-none focus:border-[#b0b3ba]"
        value={storeId}
        onChange={(e) => setStoreId(e.target.value)}
        placeholder="콘솔 » 연동 정보 » 상점 아이디(store-… 형태)"
        autoComplete="off"
      />

      <label
        className="mt-[12px] block text-[13px] font-medium text-[#555d6d]"
        htmlFor="p1-channel"
      >
        Channel key
      </label>
      <input
        id="p1-channel"
        className="mt-[6px] w-full rounded-[8px] border border-[#eeeff1] px-[12px] py-[10px] text-[15px] outline-none focus:border-[#b0b3ba]"
        value={channelKey}
        onChange={(e) => setChannelKey(e.target.value)}
        placeholder="콘솔 » 결제 연동 » 채널 관리에서 해당 채널 키 복사"
        autoComplete="off"
      />

      <div className="mt-[20px] flex justify-end gap-[10px]">
        <button
          type="button"
          className="rounded-[8px] px-[14px] py-[10px] text-[14px] font-medium text-[#555d6d]"
          onClick={onClose}
        >
          닫기
        </button>
        <button
          type="button"
          className="rounded-[8px] bg-[#1a1c20] px-[14px] py-[10px] text-[14px] font-medium text-white"
          onClick={() => {
            setPortOneBrowserOverrides({ storeId, channelKey });
            onClose();
          }}
        >
          저장
        </button>
      </div>
    </div>
  );
}

/**
 * 포트원 브라우저 SDK용 Store ID / 채널 키를 입력합니다.
 * `PORTONE_API_SECRET`은 서버 `application.yml`(또는 환경 변수)에만 두세요.
 */
export function PortOneCredentialsModal({ open, onClose }: PortOneCredentialsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-[20px]"
      role="dialog"
      aria-modal
      aria-labelledby="portone-settings-title"
    >
      <PortOneCredentialsForm onClose={onClose} />
    </div>
  );
}
