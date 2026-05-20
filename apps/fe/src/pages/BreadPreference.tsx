import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import MobileFrame from "@/components/layout/MobileFrame";
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
import { saveAiCoursePreferenceDraft } from "@/utils/aiCourseStorage";
import { formatDeparturePlaceDisplay, normalizeDepartureLabel } from "@/utils/formatDeparturePlace";
import type { KakaoSearchPlace } from "@/lib/kakaoPlaceSearch";
import { parseLatLngFromPlace } from "@/utils/parseLatLngFromPlace";

type OptionItem = {
  label: string;
  withIcon?: boolean;
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
      { label: "혼자", withIcon: true },
      { label: "커플", withIcon: true },
      { label: "친구", withIcon: true },
      { label: "가족", withIcon: true },
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

const DEPARTURE_RECENT_KEY = "aiCourseDepartureRecent";

type DepartureRecentEntry = {
  label: string;
  lat?: number;
  lng?: number;
};

type SelectedBySection = Record<string, string[]>;

function loadDepartureRecents(): DepartureRecentEntry[] {
  try {
    const raw = localStorage.getItem(DEPARTURE_RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item): DepartureRecentEntry | null => {
        if (typeof item === "string" && item.trim()) {
          const { lat, lng } = parseLatLngFromPlace(item);
          const label = normalizeDepartureLabel(item);
          return {
            label,
            ...(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
          };
        }
        if (item && typeof item === "object" && "label" in item) {
          const row = item as DepartureRecentEntry;
          const label = normalizeDepartureLabel(String(row.label ?? ""));
          if (!label) return null;
          return {
            label,
            lat: typeof row.lat === "number" ? row.lat : undefined,
            lng: typeof row.lng === "number" ? row.lng : undefined,
          };
        }
        return null;
      })
      .filter((x): x is DepartureRecentEntry => x !== null);
  } catch {
    return [];
  }
}

function saveDepartureRecents(items: DepartureRecentEntry[]) {
  try {
    localStorage.setItem(DEPARTURE_RECENT_KEY, JSON.stringify(items.slice(0, 15)));
  } catch {
    /* ignore */
  }
}

function CircleIcon() {
  return <div className="h-x14 w-x14 rounded-full bg-gray-400" />;
}

export default function BreadPreference() {
  const [selectedBySection, setSelectedBySection] = useState<SelectedBySection>({});
  const [departureKeyword, setDepartureKeyword] = useState("");
  const [departureCoords, setDepartureCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDepartureSheetOpen, setIsDepartureSheetOpen] = useState(false);
  const [sheetQuery, setSheetQuery] = useState("");
  const [recentPlaces, setRecentPlaces] = useState<DepartureRecentEntry[]>(() =>
    loadDepartureRecents(),
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
    setRecentPlaces(loadDepartureRecents());
    setIsDepartureSheetOpen(true);
  };

  const closeDepartureSheet = () => {
    setIsDepartureSheetOpen(false);
  };

  const confirmDeparture = (label: string, coords?: { lat: number; lng: number }) => {
    const t = normalizeDepartureLabel(label);
    if (!t) return;
    setDepartureKeyword(t);
    setDepartureCoords(coords ?? null);
    const entry: DepartureRecentEntry = coords ? { label: t, ...coords } : { label: t };
    const next = [entry, ...recentPlaces.filter((x) => x.label !== t)];
    setRecentPlaces(next);
    saveDepartureRecents(next);
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
        confirmDepartureFromPlace(place);

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

  const hasDepartureResult = departureKeyword.trim().length > 0;

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
    if (!canGoNext) return;
    const fallback = parseLatLngFromPlace(departureKeyword);
    const lat = departureCoords?.lat ?? fallback.lat;
    const lng = departureCoords?.lng ?? fallback.lng;
    saveAiCoursePreferenceDraft({
      companion: selectedBySection.companion?.[0] ?? "",
      budget: selectedBySection.budget?.[0] ?? "",
      minimizeRoute: selectedBySection.route?.[0] === "최소화해주세요",
      latitude: lat,
      longitude: lng,
    });
    navigate({ to: "/recommendation" });
  };

  return (
    <MobileFrame>
      <div className="pb-footer-safe flex flex-1 flex-col">
        <PreferenceTopBar title="빵 취향 선택" onCancel={() => navigate({ to: "/home" })} />

        <PreferenceIntro
          currentStep={1}
          totalStep={2}
          title="원하는 투어를 선택해주세요"
          description="설명 문구"
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
                  icon={option.withIcon ? <CircleIcon /> : undefined}
                />
              ))}
            </PreferenceQuestionSection>
          ))}

          <PreferenceQuestionSection title="출발지 검색" helperText="" columns={1}>
            <button
              type="button"
              className={cn(
                "flex h-[64px] w-full items-center justify-between rounded-r2 px-x4 transition-colors",
                hasDepartureResult
                  ? "border border-gray-600 bg-gray-300"
                  : "border border-gray-200 bg-gray-100",
              )}
              onClick={openDepartureSheet}
            >
              <span
                className={cn(
                  "flex-1 text-left font-sans text-size-5 leading-t6",
                  hasDepartureResult ? "text-gray-900" : "text-gray-500",
                )}
              >
                {departureKeyword.trim() || "출발지 입력"}
              </span>
              <span className="text-size-4 text-gray-500" aria-hidden>
                ⌕
              </span>
            </button>
          </PreferenceQuestionSection>
        </div>
      </div>

      {isDepartureSheetOpen ? (
        <>
          <button
            type="button"
            aria-label="출발지 검색 닫기"
            className="fixed inset-y-0 left-1/2 z-30 w-full max-w-x186 -translate-x-1/2 bg-black/40"
            onClick={closeDepartureSheet}
          />
          <div className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-x186 -translate-x-1/2 flex-col rounded-t-r5 bg-gray-00">
            <div className="flex justify-center py-[14px]">
              <button
                type="button"
                aria-label="닫기"
                className="h-[4px] w-[36px] rounded-full bg-gray-300"
                onClick={closeDepartureSheet}
              />
            </div>

            <div className="px-x5 pb-x5">
              <h3 className="font-pretendard text-size-7 font-bold leading-t8 text-gray-1000">
                출발지 검색
              </h3>
              <p className="mt-x1 font-pretendard text-size-3 leading-t4 text-gray-700">
                장소명을 입력하면 카카오맵에서 관련 장소를 찾아드립니다.
              </p>

              <div className="mt-x4 flex h-x14 items-center gap-x2 rounded-r3 border border-gray-300 px-x5">
                <input
                  autoFocus
                  value={sheetQuery}
                  onChange={(e) => setSheetQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      confirmDeparture(sheetQuery);
                    }
                  }}
                  placeholder="예: 서울역, 강남역 2번 출구"
                  className="min-w-0 flex-1 bg-transparent font-pretendard text-size-5 leading-t6 text-gray-1000 outline-none placeholder:text-gray-400"
                />
                <button
                  type="button"
                  aria-label="확인"
                  className="text-size-4 text-gray-700"
                  onClick={() => confirmDeparture(sheetQuery)}
                >
                  ⌕
                </button>
              </div>

              <div className="mt-x3 flex items-center justify-between border-b border-gray-200 px-x2_5 pb-x3 pt-x4">
                <span className="text-[13px] font-bold text-gray-700">최근 검색</span>
                <button
                  type="button"
                  className="text-size-3 font-medium text-[#217cf9] disabled:opacity-50"
                  disabled={isResolvingLocation}
                  onClick={useCurrentLocation}
                >
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
                    <button
                      key={item.label}
                      type="button"
                      className="flex w-full border-b border-gray-100 px-x2_5 py-x3 text-left last:border-b-0 hover:bg-gray-100"
                      onClick={() =>
                        confirmDeparture(
                          item.label,
                          item.lat !== undefined && item.lng !== undefined
                            ? { lat: item.lat, lng: item.lng }
                            : undefined,
                        )
                      }
                    >
                      <span className="font-pretendard text-size-5 leading-t6 text-gray-1000 line-clamp-2">
                        {item.label}
                      </span>
                    </button>
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
                      <p className="px-x2_5 py-x3 text-size-4 text-red-500">{kakaoSearchError}</p>
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
        </>
      ) : null}

      <OverlayFooter
        nextDisabled={!canGoNext}
        onLeftClick={() => navigate({ to: "/home" })}
        onRightClick={handleGoRecommendation}
      />
    </MobileFrame>
  );
}
