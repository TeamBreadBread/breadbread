import { useEffect, useMemo, useRef, useState } from "react";
import { getErrorMessage } from "@/api/types/common";
import { uploadImages } from "@/api/image";
import {
  checkNicknameAvailable,
  getMyProfile,
  updateMyProfile,
  type UpdateMyProfileRequest,
} from "@/api/user";
import { AppTopBar, BottomCTA, FieldLabel, TextField } from "@/components/common";
import { AppIcon, IconAssets } from "@/components/icons";
import MobileFrame from "@/components/layout/MobileFrame";
import { refreshProfileCacheFromServer } from "@/lib/userProfileCache";
import { useNavigate } from "@tanstack/react-router";

type NicknameCheckState = "idle" | "checking" | "available" | "taken";

type ProfileFormState = {
  nickname: string;
  email: string;
  profileImageUrl: string;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function isEmailValid(value: string): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ProfileFormState>({
    nickname: "",
    email: "",
    profileImageUrl: "",
  });
  const [original, setOriginal] = useState<ProfileFormState | null>(null);
  const [nicknameCheckState, setNicknameCheckState] = useState<NicknameCheckState>("idle");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const me = await getMyProfile();
        if (!active) return;
        const initial = {
          nickname: normalize(me.nickname),
          email: normalize(me.email),
          profileImageUrl: normalize(me.profileImageUrl),
        };
        setForm(initial);
        setOriginal(initial);
      } catch (error) {
        if (active) {
          window.alert(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const normalizedOriginal = original ?? { nickname: "", email: "", profileImageUrl: "" };
  const trimmedNickname = form.nickname.trim();
  const trimmedEmail = form.email.trim();
  const trimmedProfileImageUrl = form.profileImageUrl.trim();
  const isNicknameChanged = trimmedNickname !== normalizedOriginal.nickname;
  const isEmailChanged = trimmedEmail !== normalizedOriginal.email;
  const isProfileImageChanged = trimmedProfileImageUrl !== normalizedOriginal.profileImageUrl;
  const isDirty = isNicknameChanged || isEmailChanged || isProfileImageChanged;
  const emailValid = isEmailValid(trimmedEmail);
  const nicknameReady =
    !isNicknameChanged || (trimmedNickname.length > 0 && nicknameCheckState === "available");

  useEffect(() => {
    if (!original) return;
    if (trimmedNickname === normalizedOriginal.nickname) {
      setNicknameCheckState("available");
      return;
    }
    setNicknameCheckState("idle");
  }, [original, trimmedNickname, normalizedOriginal.nickname]);

  const nicknameMessage = useMemo(() => {
    if (!trimmedNickname) return "닉네임 변경 시 중복 확인이 필요합니다.";
    if (!isNicknameChanged) return "현재 사용 중인 닉네임입니다.";
    if (nicknameCheckState === "checking") return "닉네임을 확인하고 있어요.";
    if (nicknameCheckState === "available") return "사용 가능한 닉네임입니다.";
    if (nicknameCheckState === "taken") return "이미 사용 중인 닉네임입니다.";
    return "닉네임 변경 시 중복 확인이 필요합니다.";
  }, [isNicknameChanged, nicknameCheckState, trimmedNickname]);

  const nicknameMessageClassName =
    nicknameCheckState === "available"
      ? "text-[color:var(--color-green-700)]"
      : nicknameCheckState === "taken"
        ? "text-[color:var(--color-red-700)]"
        : "text-gray-700";

  const handleNicknameCheck = () => {
    if (!trimmedNickname || nicknameCheckState === "checking") return;
    void (async () => {
      try {
        setNicknameCheckState("checking");
        const available = await checkNicknameAvailable(trimmedNickname);
        setNicknameCheckState(available ? "available" : "taken");
      } catch (error) {
        setNicknameCheckState("idle");
        window.alert(getErrorMessage(error));
      }
    })();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 재선택 허용
    if (!file) return;
    void (async () => {
      try {
        setIsUploadingImage(true);
        const [url] = await uploadImages([file], "profiles");
        if (url) {
          setForm((prev) => ({ ...prev, profileImageUrl: url }));
        }
      } catch (error) {
        window.alert(getErrorMessage(error));
      } finally {
        setIsUploadingImage(false);
      }
    })();
  };

  const handleSave = () => {
    if (!original || !isDirty || !nicknameReady || !emailValid || isSaving) return;

    const payload: UpdateMyProfileRequest = {};
    if (isNicknameChanged) payload.nickname = trimmedNickname;
    if (isEmailChanged && trimmedEmail) payload.email = trimmedEmail;
    if (isProfileImageChanged) payload.profileImageUrl = trimmedProfileImageUrl;

    void (async () => {
      try {
        setIsSaving(true);
        await updateMyProfile(payload);
        refreshProfileCacheFromServer();
        window.alert("프로필을 수정했어요.");
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
        title="프로필 수정"
        centered
        showBackButton
        onBackClick={() => navigate({ to: "/account-settings" })}
      />

      <main className="flex flex-1 flex-col gap-x8 bg-[#f3f4f5] px-x5 py-x8 pb-[120px]">
        <section className="flex flex-col gap-[6px] rounded-r4 bg-white p-x5">
          <FieldLabel>닉네임</FieldLabel>
          <div className="flex flex-col gap-[6px]">
            <div className="flex gap-x2">
              <div className="flex-1">
                <TextField
                  placeholder="닉네임을 입력해주세요"
                  value={form.nickname}
                  onChange={(value) => setForm((prev) => ({ ...prev, nickname: value }))}
                  disabled={isLoading || isSaving}
                  error={Boolean(trimmedNickname) && nicknameCheckState === "taken"}
                />
              </div>
              <button
                type="button"
                className="h-x14 rounded-r3 border border-gray-300 px-x4 typo-t4bold text-gray-1000 disabled:opacity-50"
                disabled={
                  isLoading || isSaving || !trimmedNickname || nicknameCheckState === "checking"
                }
                onClick={handleNicknameCheck}
              >
                {nicknameCheckState === "checking" ? "확인 중…" : "중복 확인"}
              </button>
            </div>
            <p className={`px-x2 typo-t3regular ${nicknameMessageClassName}`}>{nicknameMessage}</p>
          </div>
        </section>

        <section className="flex flex-col gap-[6px] rounded-r4 bg-white p-x5">
          <FieldLabel>이메일</FieldLabel>
          <TextField
            placeholder="bread@example.com"
            value={form.email}
            onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
            disabled={isLoading || isSaving}
            type="email"
            error={trimmedEmail.length > 0 && !emailValid}
          />
          <p
            className={`px-x2 typo-t3regular ${
              trimmedEmail.length > 0 && !emailValid
                ? "text-[color:var(--color-red-700)]"
                : "text-gray-700"
            }`}
          >
            {trimmedEmail.length > 0 && !emailValid
              ? "올바른 이메일 형식으로 입력해주세요."
              : "비워두면 기존 이메일이 유지됩니다."}
          </p>
        </section>

        <section className="flex flex-col gap-[6px] rounded-r4 bg-white p-x5">
          <FieldLabel>프로필 이미지</FieldLabel>
          <div className="flex items-center gap-x4">
            <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-full bg-gray-200">
              {form.profileImageUrl ? (
                <img
                  src={form.profileImageUrl}
                  alt="프로필 이미지 미리보기"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <AppIcon src={IconAssets.IcPerson} size={40} className="opacity-50" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-x2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isSaving || isUploadingImage}
                className="h-x12 rounded-r3 border border-gray-300 px-x4 typo-t4bold text-gray-1000 disabled:opacity-50"
              >
                {isUploadingImage ? "업로드 중…" : "이미지 변경"}
              </button>
              {form.profileImageUrl ? (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, profileImageUrl: "" }))}
                  disabled={isLoading || isSaving || isUploadingImage}
                  className="typo-t3regular text-gray-600 underline disabled:opacity-50"
                >
                  기본 이미지로 변경
                </button>
              ) : null}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <p className="px-x2 typo-t3regular text-gray-700">
            JPG, PNG, WebP 이미지를 올릴 수 있어요.
          </p>
        </section>
      </main>

      <BottomCTA
        text={isSaving ? "저장 중…" : "저장하기"}
        disabled={
          isLoading || isSaving || isUploadingImage || !isDirty || !nicknameReady || !emailValid
        }
        onClick={handleSave}
      />
    </MobileFrame>
  );
}
