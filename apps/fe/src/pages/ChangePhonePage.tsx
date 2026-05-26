import { useEffect, useState } from "react";
import { getErrorMessage } from "@/api/types/common";
import { getMyProfile, updateMyPhone } from "@/api/user";
import { AppTopBar, BottomCTA } from "@/components/common";
import PhoneVerificationSection from "@/components/domain/auth/PhoneVerificationSection";
import MobileFrame from "@/components/layout/MobileFrame";
import { refreshProfileCacheFromServer } from "@/lib/userProfileCache";
import { useNavigate } from "@tanstack/react-router";

function formatKoreanMobile(phone: string | undefined): string {
  if (!phone || !/^010\d{8}$/.test(phone)) return "등록된 번호가 없어요.";
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}

export default function ChangePhonePage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [currentPhone, setCurrentPhone] = useState<string>();
  const [phoneDigits, setPhoneDigits] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let active = true;
    void getMyProfile()
      .then((me) => {
        if (active) {
          setCurrentPhone(me.phone ?? undefined);
        }
      })
      .catch(() => {
        /* keep empty state */
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = () => {
    if (!verificationToken || !verified || !/^010\d{8}$/.test(phoneDigits) || isSaving) return;
    void (async () => {
      try {
        setIsSaving(true);
        await updateMyPhone({ phone: phoneDigits, verificationToken });
        refreshProfileCacheFromServer();
        window.alert("전화번호를 변경했어요.");
        await navigate({ to: "/account-settings" });
      } catch (error) {
        window.alert(getErrorMessage(error));
      } finally {
        setIsSaving(false);
      }
    })();
  };

  return (
    <MobileFrame>
      <AppTopBar
        title="전화번호 변경"
        centered
        showBackButton
        onBackClick={() => navigate({ to: "/account-settings" })}
      />

      <main className="flex flex-1 flex-col gap-x8 bg-[#f3f4f5] px-x5 py-x8 pb-[120px]">
        <section className="rounded-r4 bg-white p-x5">
          <p className="typo-t4medium text-gray-800">현재 전화번호</p>
          <p className="mt-x2 typo-t5regular text-gray-1000">{formatKoreanMobile(currentPhone)}</p>
        </section>

        <section className="rounded-r4 bg-white p-x5">
          <PhoneVerificationSection
            label="새 전화번호"
            purpose="CHANGE_PHONE"
            onPhoneDigitsChange={setPhoneDigits}
            onVerificationTokenChange={setVerificationToken}
            onVerificationChange={setVerified}
          />
        </section>
      </main>

      <BottomCTA
        text={isSaving ? "변경 중…" : "전화번호 변경하기"}
        disabled={!verified || !verificationToken || !/^010\d{8}$/.test(phoneDigits) || isSaving}
        onClick={handleSave}
      />
    </MobileFrame>
  );
}
