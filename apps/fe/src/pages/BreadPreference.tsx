import { useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import MobileFrame from "@/components/layout/MobileFrame";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { AppIcon, IconAssets } from "@/components/icons";
import { OverlayFooter } from "@/components/common";
import { PreferenceOptionCard } from "@/components/common/cards";
import PreferenceIntro from "@/components/domain/ai-course/PreferenceIntro";
import PreferenceQuestionSection from "@/components/domain/ai-course/PreferenceQuestionSection";
import PreferenceTopBar from "@/components/domain/ai-course/PreferenceTopBar";
import { useKakaoPlaceSearch } from "@/hooks/useKakaoPlaceSearch";
import { getAccuratePosition } from "@/lib/getAccuratePosition";
import { isKakaoPlaceSearchConfigured, resolveCurrentLocationPlace } from "@/lib/kakaoPlaceSearch";
import { sectionAllowsMultipleChoice } from "@/utils/preferenceSelection";
import { cn } from "@/utils/cn";
import { setAiCourseDepartureCoords } from "@/lib/aiCourseDepartureCoords";
import { saveAiCoursePreferenceDraft } from "@/utils/aiCourseStorage";
import { formatDeparturePlaceDisplay, normalizeDepartureLabel } from "@/utils/formatDeparturePlace";
import {
  loadDeparturePlaceRecents,
  pushDeparturePlaceRecent,
  saveDeparturePlaceRecents,
  type DepartureRecentEntry,
} from "@/utils/departurePlaceRecents";
import type { KakaoSearchPlace } from "@/lib/kakaoPlaceSearch";
import AloneCategoryImg from "@/assets/icons/Img_alone.svg";
import CoupleCategoryImg from "@/assets/icons/Img_couple.svg";
import FriendCategoryImg from "@/assets/icons/Img_friend.svg";
import FamilyCategoryImg from "@/assets/icons/Img_family.svg";

type OptionItem = {
  label: string;
  withIcon?: boolean;
  /** 함께하는 대상 아이콘 이미지 경로 (없으면 기본 원형) */
  iconSrc?: string;
};

type QuestionItem = {
  id: string;
  title: string;
  helperText?: string;
  allowMultiple?: boolean;
  columns?: 1 | 2;
  options: OptionItem[];
};

const QUESTION_SECTIONS: QuestionItem[] = [
  {
    id: "companion",
    title: "누구와 함께 하시나요?",
    helperText: "",
    options: [
      { label: "혼자", withIcon: true, iconSrc: AloneCategoryImg },
      { label: "커플", withIcon: true, iconSrc: CoupleCategoryImg },
      { label: "친구", withIcon: true, iconSrc: FriendCategoryImg },
      { label: "가족", withIcon: true, iconSrc: FamilyCategoryImg },
    ],
  },
  {
    id: "budget",
    title: "예산이 어떻게 되시나요?",
    helperText: "",
    options: [
      { label: "2만원 이하" },
      { label: "2 - 4만원" },
      { label: "4만원 이상" },
      { label: "상관없어요" },
    ],
  },
  {
    id: "route",
    title: "코스 동선을 최소화 해드릴까요?",
    helperText: "",
    columns: 1,
    options: [{ label: "최소화해주세요" }, { label: "상관없어요" }],
  },
];

type SelectedBySection = Record<string, string[]>;

function CircleIcon() {
  return <div className="h-x14 w-x14 rounded-full bg-gray-400" />;
}

function CompanionIcon({ src, label }: { src: string; label: string }) {
  return <img src={src} alt={label} className="h-x14 w-x14 object-contain" />;
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("size-x6 shrink-0", className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.6518 20.9825C14.3428 20.4319 15.2665 19.638 16.1932 18.6662C18.0085 16.7625 20 14.006 20 10.9611C20 6.56429 16.4183 3 12 3C7.58172 3 4 6.56429 4 10.9611C4 14.006 5.99152 16.7625 7.80681 18.6662C8.73347 19.638 9.65717 20.4319 10.3482 20.9825C10.7282 21.2853 11.115 21.583 11.5181 21.8552C11.8039 22.0477 12.194 22.0485 12.4802 21.8563C12.8839 21.5838 13.2713 21.2857 13.6518 20.9825ZM14.6192 10.961C14.6192 12.4004 13.4466 13.5673 12.0001 13.5673C10.5537 13.5673 9.38108 12.4004 9.38108 10.961C9.38108 9.52155 10.5537 8.35467 12.0001 8.35467C13.4466 8.35467 14.6192 9.52155 14.6192 10.961Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GpsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("h-[14px] w-[14px] shrink-0", className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.0002 3.7998C16.5299 3.79991 20.1616 7.45356 20.1985 11.9629C20.1989 11.9752 20.2004 11.9876 20.2004 12C20.2004 12.0036 20.1995 12.0072 20.1995 12.0107C20.1995 12.0179 20.2004 12.0251 20.2004 12.0322C20.2004 16.5838 16.5414 20.2001 12.0002 20.2002C7.45896 20.2002 3.80006 16.5839 3.80005 12.0322V12C3.80005 11.9876 3.80058 11.9752 3.80103 11.9629C3.83793 7.4535 7.47051 3.7998 12.0002 3.7998ZM13.0002 7.7998C13.0002 8.35202 12.5524 8.7997 12.0002 8.7998C11.448 8.7998 11.0002 8.35209 11.0002 7.7998V5.87988C8.37786 6.30412 6.3191 8.37118 5.88599 11H7.80005C8.35233 11 8.80005 11.4477 8.80005 12C8.79994 12.5522 8.35227 13 7.80005 13H5.87524C6.28531 15.6425 8.35076 17.7021 11.0002 18.1211V16.2002C11.0002 15.6479 11.448 15.2002 12.0002 15.2002C12.5524 15.2003 13.0002 15.648 13.0002 16.2002V18.1211C15.6497 17.702 17.7152 15.6425 18.1252 13H16.2004C15.6482 13 15.2005 12.5522 15.2004 12C15.2004 11.4477 15.6482 11 16.2004 11H18.1145C17.6814 8.37124 15.6226 6.30419 13.0002 5.87988V7.7998Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("size-x6 shrink-0", className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.2861 3C14.3097 3.00023 17.5713 6.26248 17.5713 10.2861C17.5712 11.9382 17.0195 13.4605 16.0928 14.6826C16.1071 14.6954 16.122 14.7079 16.1357 14.7217L20.707 19.293C21.0974 19.6835 21.0974 20.3165 20.707 20.707C20.3166 21.0975 19.6835 21.0974 19.293 20.707L14.7217 16.1357C14.7079 16.122 14.6954 16.1071 14.6826 16.0928C13.4605 17.0195 11.9382 17.5712 10.2861 17.5713C6.26248 17.5713 3.00023 14.3097 3 10.2861C3 6.26234 6.26234 3 10.2861 3ZM10.2861 5C7.36691 5 5 7.36691 5 10.2861C5.00023 13.2052 7.36705 15.5713 10.2861 15.5713C13.205 15.5711 15.5711 13.205 15.5713 10.2861C15.5713 7.36705 13.2052 5.00023 10.2861 5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function BreadPreference() {
  const [selectedBySection, setSelectedBySection] = useState<SelectedBySection>({});
  const [departureKeyword, setDepartureKeyword] = useState("");
  const [departureCoords, setDepartureCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [departureMarkerLabel, setDepartureMarkerLabel] = useState<string>("출발지");
  const [isDepartureSheetOpen, setIsDepartureSheetOpen] = useState(false);
  const [sheetQuery, setSheetQuery] = useState("");
  const [recentPlaces, setRecentPlaces] = useState<DepartureRecentEntry[]>(() =>
    loadDeparturePlaceRecents(),
  );
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (sectionId: string, optionLabel: string) => {
    setSelectedBySection((prev) => {
      const current = prev[sectionId] ?? [];
      const isSelected = current.includes(optionLabel);
      const section = QUESTION_SECTIONS.find((s) => s.id === sectionId);
      const allowsMultiple = section ? sectionAllowsMultipleChoice(section) : false;

      let nextSectionValues: string[];
      if (allowsMultiple) {
        nextSectionValues = isSelected
          ? current.filter((selectedOption) => selectedOption !== optionLabel)
          : [...current, optionLabel];
      } else {
        nextSectionValues = isSelected ? [] : [optionLabel];
      }

      return { ...prev, [sectionId]: nextSectionValues };
    });
  };

  const openDepartureSheet = () => {
    setSheetQuery(departureKeyword);
    setRecentPlaces(loadDeparturePlaceRecents());
    setIsDepartureSheetOpen(true);
  };

  const closeDepartureSheet = () => {
    setIsDepartureSheetOpen(false);
  };

  const removeDepartureRecent = (label: string, e: MouseEvent) => {
    e.stopPropagation();
    setRecentPlaces((prev) => {
      const next = prev.filter((item) => item.label !== label);
      saveDeparturePlaceRecents(next);
      return next;
    });
  };

  const confirmDeparture = (
    label: string,
    coords: { lat: number; lng: number },
    markerLabel = "출발지",
  ) => {
    const t = normalizeDepartureLabel(label);
    if (!t) return;
    setDepartureKeyword(t);
    setDepartureCoords(coords);
    setDepartureMarkerLabel(markerLabel);
    const entry: DepartureRecentEntry = { label: t, lat: coords.lat, lng: coords.lng };
    const next = pushDeparturePlaceRecent(recentPlaces, entry);
    setRecentPlaces(next);
    saveDeparturePlaceRecents(next);
    closeDepartureSheet();
  };

  const confirmDepartureFromPlace = (place: KakaoSearchPlace) => {
    confirmDeparture(formatDeparturePlaceDisplay(place), { lat: place.lat, lng: place.lng });
  };

  const useCurrentLocation = () => {
    setIsResolvingLocation(true);
    void (async () => {
      try {
        const { latitude, longitude, accuracy } = await getAccuratePosition();
        const place = await resolveCurrentLocationPlace(latitude, longitude);
        confirmDeparture(
          formatDeparturePlaceDisplay(place),
          { lat: place.lat, lng: place.lng },
          "현재 위치",
        );

        if (accuracy !== null && accuracy > 120) {
          window.alert(
            `GPS 정확도가 약 ${Math.round(accuracy)}m입니다. PC·실내에서는 오차가 클 수 있어, 정확한 출발지는 검색으로 선택해 주세요.`,
          );
        }
      } catch {
        window.alert(
          "현재 위치를 가져오지 못했습니다. 브라우저 위치 권한을 허용했는지 확인하거나, 출발지를 직접 검색해 주세요.",
        );
      } finally {
        setIsResolvingLocation(false);
      }
    })();
  };

  const handleManualDepartureConfirm = () => {
    if (!sheetQueryTrimmed) return;
    window.alert("출발지는 아래 카카오 장소 검색 결과나 현재 위치에서 선택해 주세요.");
  };

  const hasDepartureResult = departureKeyword.trim().length > 0 && departureCoords !== null;

  const filteredRecents = recentPlaces.filter((item) =>
    item.label.toLowerCase().includes(sheetQuery.trim().toLowerCase()),
  );

  const sheetQueryTrimmed = sheetQuery.trim();
  const {
    results: kakaoPlaces,
    loading: kakaoSearchLoading,
    error: kakaoSearchError,
  } = useKakaoPlaceSearch(sheetQuery, isDepartureSheetOpen);
  const showKakaoSearch = sheetQueryTrimmed.length > 0 && isKakaoPlaceSearchConfigured();

  const allQuestionSectionsAnswered = QUESTION_SECTIONS.every(
    (section) => (selectedBySection[section.id]?.length ?? 0) > 0,
  );
  const canGoNext = allQuestionSectionsAnswered && hasDepartureResult;

  const handleGoRecommendation = () => {
    if (!canGoNext || !departureCoords) return;
    setAiCourseDepartureCoords(departureCoords.lat, departureCoords.lng, departureMarkerLabel);
    saveAiCoursePreferenceDraft({
      companion: selectedBySection.companion?.[0] ?? "",
      budget: selectedBySection.budget?.[0] ?? "",
      minimizeRoute: selectedBySection.route?.[0] === "최소화해주세요",
    });
    navigate({ to: "/recommendation" });
  };

  return (
    <MobileFrame>
      <div className="pb-footer-safe flex flex-1 flex-col">
        <PreferenceTopBar
          title="빵 취향 선택"
          onBack={() => navigate({ to: "/home" })}
          onCancel={() => navigate({ to: "/home" })}
        />

        <PreferenceIntro
          currentStep={1}
          totalStep={2}
          title="원하는 투어를 선택해주세요"
          description="조건에 맞춰 최적의 이동 동선을 찾아드려요."
        />

        <div className="flex flex-col gap-x2-5">
          {QUESTION_SECTIONS.map((section) => (
            <PreferenceQuestionSection
              key={section.id}
              title={section.title}
              helperText={section.helperText}
              columns={section.columns}
            >
              {section.options.map((option) => (
                <PreferenceOptionCard
                  key={`${section.title}-${option.label}`}
                  label={option.label}
                  selected={selectedBySection[section.id]?.includes(option.label) ?? false}
                  onClick={() => handleSelect(section.id, option.label)}
                  icon={
                    option.iconSrc ? (
                      <CompanionIcon src={option.iconSrc} label={option.label} />
                    ) : option.withIcon ? (
                      <CircleIcon />
                    ) : undefined
                  }
                />
              ))}
            </PreferenceQuestionSection>
          ))}

          <PreferenceQuestionSection
            title="어디서부터 빵투어를 시작해볼까요?"
            helperText=""
            columns={1}
          >
            <button
              type="button"
              className={cn(
                "flex h-[64px] w-full items-center gap-x2 rounded-r2 px-x4 transition-colors",
                hasDepartureResult
                  ? "border border-orange-600 bg-orange-100"
                  : "border border-gray-200 bg-gray-00",
              )}
              onClick={openDepartureSheet}
            >
              <PinIcon className={hasDepartureResult ? "text-orange-600" : "text-gray-500"} />
              <span
                className={cn(
                  "flex-1 text-left font-sans text-size-5 leading-t6",
                  hasDepartureResult ? "text-orange-600" : "text-gray-500",
                )}
              >
                {departureKeyword.trim() || "출발지 입력"}
              </span>
              <SearchIcon className="text-gray-1000" />
            </button>
          </PreferenceQuestionSection>
        </div>
      </div>

      {isDepartureSheetOpen
        ? createPortal(
            <div className="fixed inset-0 z-[100]">
              <button
                type="button"
                aria-label="출발지 검색 닫기"
                className="absolute inset-0 bg-black/40"
                onClick={closeDepartureSheet}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 flex items-end justify-center">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="ai-departure-sheet-title"
                  className={cn(
                    "pointer-events-auto flex max-h-[min(90vh,780px)] w-full flex-col overflow-hidden rounded-t-r5 bg-gray-00",
                    RESPONSIVE_FRAME_WIDTH,
                  )}
                >
                  <button
                    type="button"
                    aria-label="닫기"
                    className="flex h-x6 w-full shrink-0 items-center justify-center"
                    onClick={closeDepartureSheet}
                  >
                    <span className="h-x1 w-x9 rounded-full bg-gray-400" aria-hidden />
                  </button>

                  <div className="px-x5 pb-x5">
                    <h3
                      id="ai-departure-sheet-title"
                      className="font-pretendard text-size-7 font-bold leading-t8 text-gray-1000"
                    >
                      출발지 검색
                    </h3>
                    <p className="mt-x1 font-pretendard text-size-3 leading-t4 text-gray-700">
                      선택하신 장소 주변으로 코스를 짜드려요.
                    </p>

                    <div className="mt-x4 flex h-x14 items-center gap-x2 rounded-r3 border border-gray-300 px-x5">
                      <input
                        autoFocus
                        value={sheetQuery}
                        onChange={(e) => setSheetQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleManualDepartureConfirm();
                          }
                        }}
                        placeholder="빵집 이름이나 동네를 입력해보세요"
                        className="min-w-0 flex-1 bg-transparent font-pretendard text-size-5 leading-t6 text-gray-1000 outline-none placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        aria-label="검색"
                        className="flex shrink-0 items-center justify-center self-stretch"
                        onClick={handleManualDepartureConfirm}
                      >
                        <AppIcon src={IconAssets.IcSearch} size="x6" />
                      </button>
                    </div>
                    {sheetQueryTrimmed.length > 0 ? (
                      <p className="mt-x2 px-x1 text-size-3 text-gray-600">
                        엔터로 바로 확정되지 않습니다. 아래 카카오 장소 검색 결과에서 출발지를
                        선택해 주세요.
                      </p>
                    ) : null}

                    <div className="mt-x3 flex items-center justify-between border-b border-gray-200 px-x2_5 pb-x3 pt-x4">
                      <span className="text-[13px] font-bold text-gray-700">최근 검색</span>
                      <button
                        type="button"
                        className="flex items-center gap-x1 typo-t3medium text-blue-700 disabled:opacity-50"
                        disabled={isResolvingLocation}
                        onClick={useCurrentLocation}
                      >
                        <GpsIcon className="text-blue-700" />
                        {isResolvingLocation ? "위치 확인 중…" : "현재 위치"}
                      </button>
                    </div>

                    <div className="max-h-[min(50vh,360px)] overflow-y-auto">
                      {filteredRecents.length === 0 && !showKakaoSearch ? (
                        <p className="px-x2_5 py-x4 text-size-4 text-gray-600">
                          최근 검색한 출발지가 여기에 표시됩니다.
                        </p>
                      ) : (
                        filteredRecents.map((item) => (
                          <div
                            key={item.label}
                            className="flex w-full items-center gap-x2 border-b border-gray-100 px-x2_5 py-x3 last:border-b-0 hover:bg-gray-100"
                          >
                            <button
                              type="button"
                              className="min-w-0 flex-1 text-left"
                              onClick={() =>
                                confirmDeparture(item.label, { lat: item.lat!, lng: item.lng! })
                              }
                            >
                              <span className="font-pretendard text-size-5 leading-t6 text-gray-1000 line-clamp-2">
                                {item.label}
                              </span>
                            </button>
                            <button
                              type="button"
                              className="flex shrink-0 items-center justify-center p-x0-5"
                              aria-label={`${item.label} 삭제`}
                              onClick={(e) => removeDepartureRecent(item.label, e)}
                            >
                              <AppIcon
                                src={IconAssets.IcClose}
                                size="x6"
                                className="icon-gray-600"
                              />
                            </button>
                          </div>
                        ))
                      )}

                      {showKakaoSearch ? (
                        <>
                          <div className="sticky top-0 border-b border-gray-200 bg-gray-00 px-x2_5 pb-x2 pt-x3">
                            <span className="text-[13px] font-bold text-gray-700">장소 검색</span>
                          </div>
                          {kakaoSearchLoading ? (
                            <p className="px-x2_5 py-x3 text-size-4 text-gray-500">검색 중…</p>
                          ) : null}
                          {kakaoSearchError ? (
                            <p className="px-x2_5 py-x3 text-size-4 text-red-500">
                              {kakaoSearchError}
                            </p>
                          ) : null}
                          {!kakaoSearchLoading && !kakaoSearchError && kakaoPlaces.length === 0 ? (
                            <p className="px-x2_5 py-x3 text-size-4 text-gray-500">
                              검색 결과가 없습니다.
                            </p>
                          ) : null}
                          {kakaoPlaces.map((place) => (
                            <button
                              key={place.id}
                              type="button"
                              className="flex w-full flex-col gap-x0-5 border-b border-gray-100 px-x2_5 py-x3 text-left last:border-b-0 hover:bg-gray-100"
                              onClick={() => confirmDepartureFromPlace(place)}
                            >
                              <span className="font-pretendard text-size-5 leading-t6 text-gray-1000">
                                {place.name}
                              </span>
                              {place.address ? (
                                <span className="font-pretendard text-size-3 leading-t4 text-gray-600">
                                  {place.address}
                                </span>
                              ) : null}
                            </button>
                          ))}
                        </>
                      ) : sheetQueryTrimmed.length > 0 ? (
                        <p className="px-x2_5 py-x3 text-size-4 text-gray-500">
                          카카오 API 키를 설정하면 장소 검색을 사용할 수 있습니다.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <OverlayFooter
        nextDisabled={!canGoNext}
        onLeftClick={() => navigate({ to: "/home" })}
        onRightClick={handleGoRecommendation}
      />
    </MobileFrame>
  );
}
