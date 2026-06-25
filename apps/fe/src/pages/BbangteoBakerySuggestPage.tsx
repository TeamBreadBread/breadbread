import { useState, type ReactNode } from "react";

import { useNavigate } from "@tanstack/react-router";

import { submitNewBakeryReport, submitUpdateBakeryReport } from "@/api/bakery";
import { getErrorMessage } from "@/api/types/common";
import type { BakeryListItem } from "@/api/types/bakery";

import { AppIcon, IconAssets } from "@/components/icons";

import BakerySuggestExistingSearchField from "@/components/domain/bbangteo/BakerySuggestExistingSearchField";

import BakerySuggestPlaceSearchField, {
  type BakerySuggestPlaceSelection,
} from "@/components/domain/bbangteo/BakerySuggestPlaceSearchField";

import BottomNav from "@/components/layout/BottomNav";

import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";

import MobileFrame from "@/components/layout/MobileFrame";

import { isKakaoPlaceSearchConfigured } from "@/lib/kakaoPlaceSearch";

import { type BakeryCorrectionField, type BakerySuggestType } from "@/lib/bakerySuggestStorage";

import { mapCorrectionFieldToApi, parseRepresentativeMenus } from "@/utils/bakeryReport";

import { cn } from "@/utils/cn";

type FormState = {
  type: BakerySuggestType;

  bakeryName: string;

  address: string;

  dong: string;

  signatureMenu: string;

  menuName: string;

  message: string;

  targetBakeryId: number | null;

  correctionTarget: BakeryCorrectionField | null;

  correctedInfo: string;
};

const INITIAL_FORM: FormState = {
  type: "NEW",

  bakeryName: "",

  address: "",

  dong: "",

  signatureMenu: "",

  menuName: "",

  message: "",

  targetBakeryId: null,

  correctionTarget: null,

  correctedInfo: "",
};

const CORRECTION_OPTIONS: { value: BakeryCorrectionField; label: string }[] = [
  { value: "ADDRESS", label: "주소" },

  { value: "DONG", label: "동(행정동)" },

  { value: "MENU", label: "대표 메뉴" },

  { value: "HOURS", label: "영업시간" },

  { value: "OTHER", label: "기타" },
];

const CORRECTION_PLACEHOLDER: Record<BakeryCorrectionField, string> = {
  ADDRESS: "올바른 주소를 입력해주세요",

  DONG: "올바른 행정동을 입력해주세요",

  MENU: "올바른 대표 메뉴를 입력해주세요",

  HOURS: "올바른 영업시간을 입력해주세요",

  OTHER: "수정이 필요한 내용을 입력해주세요",
};

const TYPE_INTRO: Record<BakerySuggestType, readonly [string, string]> = {
  NEW: [
    "아직 빵빵에 등록되지 않은 빵집을 알려주세요.",
    "빵집 이름이나 주소로 검색해 선택하면 정보가 자동으로 채워져요.",
  ],
  UPDATE: [
    "이미 등록된 빵집 중 틀리거나 빠진 정보를 알려주세요.",
    "수정할 빵집을 먼저 선택해주세요.",
  ],
  MENU: [
    "등록된 빵집에 빠진 메뉴가 있다면 알려주세요.",
    "건의할 빵집을 선택하고 메뉴 이름을 입력해주세요.",
  ],
};

function SuggestHeader() {
  const navigate = useNavigate();

  return (
    <>
      <header className={BBANGTEO_FIXED_HEADER_OUTER_CLASS}>
        <div className="relative flex h-[56px] items-center justify-between px-[20px]">
          <button
            type="button"
            className="flex h-[36px] w-[36px] items-center justify-center"
            onClick={() => void navigate({ to: "/bbangteo" })}
          >
            <AppIcon src={IconAssets.IcChevronLeft} size="x6" alt="뒤로가기" />
          </button>
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[18px] font-bold leading-[24px] text-[#1a1c20]">
            빵집 건의함
          </h1>
          <div className="h-[36px] w-[36px]" aria-hidden />
        </div>
      </header>
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
}

function FormField({
  label,

  required,

  children,
}: {
  label: string;

  required?: boolean;

  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-[8px]">
      <span className="text-[14px] font-semibold leading-[19px] text-[#1a1c20]">
        {label}

        {required ? <span className="text-[#E8623A]"> *</span> : null}
      </span>

      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-[12px] border border-[#dcdee3] bg-white px-[16px] py-[14px] text-[16px] leading-[22px] text-[#1a1c20] placeholder:text-[#d1d3d8] outline-none focus:border-[#E8623A]/50";

function isNewFormComplete(form: FormState): boolean {
  return (
    form.bakeryName.trim().length > 0 &&
    form.address.trim().length > 0 &&
    form.dong.trim().length > 0 &&
    form.signatureMenu.trim().length > 0 &&
    form.message.trim().length > 0
  );
}

function isUpdateFormComplete(form: FormState): boolean {
  return (
    form.targetBakeryId != null &&
    form.correctionTarget != null &&
    form.correctedInfo.trim().length > 0 &&
    form.message.trim().length > 0
  );
}

function isMenuFormComplete(form: FormState): boolean {
  return form.targetBakeryId != null && form.menuName.trim().length > 0;
}

function SubmitButton({
  canSubmit,
  isSubmitting,
  onSubmit,
}: {
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!canSubmit || isSubmitting}
      onClick={onSubmit}
      className={cn(
        "w-full rounded-[12px] py-[16px] text-[16px] font-semibold leading-[22px] transition-colors",
        canSubmit && !isSubmitting
          ? "bg-orange-600 text-white"
          : "cursor-not-allowed bg-[#f3f4f5] text-[#b0b3ba]",
      )}
    >
      {isSubmitting ? "전송 중…" : "전송하기"}
    </button>
  );
}

function SelectedBakeryPreview({
  bakeryName,

  address,

  dong,
}: {
  bakeryName: string;

  address: string;

  dong: string;
}) {
  return (
    <div className="rounded-[12px] border border-[#f3f4f5] bg-[#f7f8f9] px-[16px] py-[14px]">
      <p className="text-[14px] font-semibold leading-[19px] text-[#1a1c20]">{bakeryName}</p>

      {address ? (
        <p className="mt-[4px] text-[13px] leading-[18px] text-[#868b94]">{address}</p>
      ) : null}

      {dong ? <p className="mt-[2px] text-[12px] leading-[17px] text-[#b0b3ba]">{dong}</p> : null}
    </div>
  );
}

export default function BbangteoBakerySuggestPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const kakaoPlaceSearchEnabled = isKakaoPlaceSearchConfigured();

  const isNewType = form.type === "NEW";
  const isUpdateType = form.type === "UPDATE";

  const canSubmit = isNewType
    ? isNewFormComplete(form)
    : isUpdateType
      ? isUpdateFormComplete(form)
      : isMenuFormComplete(form);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTypeChange = (type: BakerySuggestType) => {
    if (form.type === type) return;
    setForm({ ...INITIAL_FORM, type });
    setSelectedPlaceId(null);
  };

  const handleBakeryNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      bakeryName: value,
      ...(selectedPlaceId
        ? {
            address: "",
            dong: "",
          }
        : {}),
    }));
    if (selectedPlaceId) {
      setSelectedPlaceId(null);
    }
  };

  const handlePlaceSelect = (selection: BakerySuggestPlaceSelection) => {
    setForm((prev) => ({
      ...prev,
      bakeryName: selection.bakeryName,
      address: selection.address,
      dong: selection.dong,
    }));
    setSelectedPlaceId(selection.placeId);
  };

  const handleClearPlaceSelection = () => {
    setSelectedPlaceId(null);
    setForm((prev) => ({
      ...prev,
      bakeryName: "",
      address: "",
      dong: "",
    }));
  };

  const handleExistingBakeryNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      bakeryName: value,
      ...(prev.targetBakeryId != null
        ? {
            targetBakeryId: null,
            address: "",
            dong: "",
          }
        : {}),
    }));
  };

  const handleExistingBakerySelect = (bakery: BakeryListItem) => {
    setForm((prev) => ({
      ...prev,
      targetBakeryId: bakery.id,
      bakeryName: bakery.name,
      address: bakery.address ?? "",
      dong: bakery.dong?.trim() ?? "",
    }));
  };

  const handleClearExistingBakerySelection = () => {
    setForm((prev) => ({
      ...prev,
      targetBakeryId: null,
      bakeryName: "",
      address: "",
      dong: "",
    }));
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (isNewType) {
        await submitNewBakeryReport({
          bakeryName: form.bakeryName.trim(),
          address: form.address.trim() || undefined,
          district: form.dong.trim() || undefined,
          representativeMenus: parseRepresentativeMenus(form.signatureMenu.trim()),
          recommendation: form.message.trim() || undefined,
        });
      } else if (isUpdateType) {
        if (form.correctionTarget == null) return;

        await submitUpdateBakeryReport({
          targetBakeryName: form.bakeryName.trim(),
          updateField: mapCorrectionFieldToApi(form.correctionTarget),
          correctValue: form.correctedInfo.trim(),
          description: form.message.trim() || undefined,
        });
      } else {
        await submitUpdateBakeryReport({
          targetBakeryName: form.bakeryName.trim(),
          updateField: "REPRESENTATIVE_MENU",
          correctValue: form.menuName.trim(),
          description: form.message.trim() || undefined,
        });
      }

      setSubmitted(true);
    } catch (error) {
      window.alert(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <MobileFrame className="bg-white">
        <div className="flex min-h-screen flex-1 flex-col bg-white">
          <SuggestHeader />

          <main className="flex flex-1 flex-col items-center justify-center gap-[16px] px-[24px] pb-[calc(56px+24px+env(safe-area-inset-bottom,0px))] text-center sm:pb-[calc(60px+24px+env(safe-area-inset-bottom,0px))]">
            <span className="text-[48px]" aria-hidden>
              🥐
            </span>

            <p className="text-[18px] font-bold leading-[24px] text-[#1a1c20]">
              소중한 제보 감사해요!
            </p>

            <p className="text-[14px] leading-[21px] text-[#868b94]">
              알려주신 내용은 검토 후
              <br />
              빵빵 서비스에 반영할게요.
            </p>

            <button
              type="button"
              className="mt-[8px] rounded-[12px] bg-[#1a1c20] px-[24px] py-[14px] text-[15px] font-semibold text-white"
              onClick={() => void navigate({ to: "/bbangteo" })}
            >
              빵터로 돌아가기
            </button>
          </main>
        </div>

        <BottomNav />
      </MobileFrame>
    );
  }

  return (
    <MobileFrame className="bg-white">
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <SuggestHeader />

        <main className="flex flex-col gap-[24px] px-[20px] py-[20px] pb-[calc(56px+80px+env(safe-area-inset-bottom,0px))] sm:pb-[calc(60px+80px+env(safe-area-inset-bottom,0px))]">
          <p className="text-[14px] leading-[21px] text-[#868b94]">
            {TYPE_INTRO[form.type][0]}
            <br />
            {TYPE_INTRO[form.type][1]}
          </p>

          <fieldset className="grid grid-cols-3 gap-[8px]">
            <legend className="sr-only">건의 유형</legend>

            {(
              [
                { value: "NEW" as const, label: "빵집 건의" },

                { value: "UPDATE" as const, label: "수정함" },

                { value: "MENU" as const, label: "메뉴 건의" },
              ] as const
            ).map((option) => {
              const selected = form.type === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTypeChange(option.value)}
                  className={cn(
                    "rounded-[10px] border px-[8px] py-[10px] text-[13px] font-medium leading-[18px] transition-colors",

                    selected
                      ? "border-[#E8623A] bg-[#FFF0EB] text-[#1a1c20]"
                      : "border-[#dcdee3] bg-white text-[#868b94]",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </fieldset>

          {isNewType ? (
            <>
              <FormField label="빵집 이름" required>
                {kakaoPlaceSearchEnabled ? (
                  <BakerySuggestPlaceSearchField
                    value={form.bakeryName}
                    selectedPlaceId={selectedPlaceId}
                    onValueChange={handleBakeryNameChange}
                    onPlaceSelect={handlePlaceSelect}
                    onClearSelection={handleClearPlaceSelection}
                    inputClassName={inputClassName}
                  />
                ) : (
                  <input
                    type="text"
                    value={form.bakeryName}
                    onChange={(e) => handleBakeryNameChange(e.target.value)}
                    placeholder="예) 성심당 본점"
                    className={inputClassName}
                    maxLength={80}
                  />
                )}
              </FormField>

              {kakaoPlaceSearchEnabled && selectedPlaceId != null ? (
                <SelectedBakeryPreview
                  bakeryName={form.bakeryName}
                  address={form.address}
                  dong={form.dong}
                />
              ) : null}

              {!kakaoPlaceSearchEnabled ? (
                <>
                  <FormField label="주소">
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                      placeholder="도로명 또는 지번 주소"
                      className={inputClassName}
                      maxLength={200}
                    />
                  </FormField>

                  <FormField label="동(행정동)">
                    <input
                      type="text"
                      value={form.dong}
                      onChange={(e) => update("dong", e.target.value)}
                      placeholder="예) 은행동"
                      className={inputClassName}
                      maxLength={40}
                    />
                  </FormField>
                </>
              ) : (
                <FormField label="동(행정동)">
                  <input
                    type="text"
                    value={form.dong}
                    onChange={(e) => update("dong", e.target.value)}
                    placeholder="검색 후 자동으로 채워져요"
                    className={inputClassName}
                    maxLength={40}
                  />
                </FormField>
              )}

              <FormField label="대표 메뉴">
                <input
                  type="text"
                  value={form.signatureMenu}
                  onChange={(e) => update("signatureMenu", e.target.value)}
                  placeholder="예) 튀김소보로, 명란바게트"
                  className={inputClassName}
                  maxLength={120}
                />
              </FormField>

              <FormField label="한 줄 추천">
                <textarea
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="이 빵집을 추천하는 이유를 적어주세요"
                  className={cn(inputClassName, "min-h-[120px] resize-none")}
                  maxLength={500}
                />
              </FormField>
            </>
          ) : isUpdateType ? (
            <>
              <FormField label="수정할 빵집" required>
                <BakerySuggestExistingSearchField
                  value={form.bakeryName}
                  selectedBakeryId={form.targetBakeryId}
                  onValueChange={handleExistingBakeryNameChange}
                  onBakerySelect={handleExistingBakerySelect}
                  onClearSelection={handleClearExistingBakerySelection}
                  inputClassName={inputClassName}
                />
              </FormField>

              {form.targetBakeryId != null ? (
                <SelectedBakeryPreview
                  bakeryName={form.bakeryName}
                  address={form.address}
                  dong={form.dong}
                />
              ) : null}

              <FormField label="수정할 항목" required>
                <div className="flex flex-wrap gap-[8px]">
                  {CORRECTION_OPTIONS.map((option) => {
                    const selected = form.correctionTarget === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => update("correctionTarget", option.value)}
                        className={cn(
                          "rounded-[999px] border px-[12px] py-[8px] text-[13px] font-medium leading-[18px] transition-colors",

                          selected
                            ? "border-[#E8623A] bg-[#FFF0EB] text-[#1a1c20]"
                            : "border-[#dcdee3] bg-white text-[#868b94]",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </FormField>

              <FormField label="올바른 정보" required>
                <input
                  type="text"
                  value={form.correctedInfo}
                  onChange={(e) => update("correctedInfo", e.target.value)}
                  placeholder={
                    form.correctionTarget
                      ? CORRECTION_PLACEHOLDER[form.correctionTarget]
                      : "먼저 수정할 항목을 선택해주세요"
                  }
                  className={inputClassName}
                  maxLength={200}
                  disabled={form.correctionTarget == null}
                />
              </FormField>

              <FormField label="추가 설명">
                <textarea
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="어떤 정보가 틀렸는지, 참고할 내용이 있다면 적어주세요"
                  className={cn(inputClassName, "min-h-[120px] resize-none")}
                  maxLength={500}
                />
              </FormField>
            </>
          ) : (
            <>
              <FormField label="건의할 빵집" required>
                <BakerySuggestExistingSearchField
                  value={form.bakeryName}
                  selectedBakeryId={form.targetBakeryId}
                  onValueChange={handleExistingBakeryNameChange}
                  onBakerySelect={handleExistingBakerySelect}
                  onClearSelection={handleClearExistingBakerySelection}
                  inputClassName={inputClassName}
                />
              </FormField>

              {form.targetBakeryId != null ? (
                <SelectedBakeryPreview
                  bakeryName={form.bakeryName}
                  address={form.address}
                  dong={form.dong}
                />
              ) : null}

              <FormField label="메뉴 이름" required>
                <input
                  type="text"
                  value={form.menuName}
                  onChange={(e) => update("menuName", e.target.value)}
                  placeholder="예) 튀김소보로, 명란바게트"
                  className={inputClassName}
                  maxLength={120}
                />
              </FormField>

              <FormField label="추가 설명">
                <textarea
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="가격, 맛 후기 등 참고할 내용이 있다면 적어주세요"
                  className={cn(inputClassName, "min-h-[120px] resize-none")}
                  maxLength={500}
                />
              </FormField>
            </>
          )}

          <SubmitButton canSubmit={canSubmit} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
        </main>
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
