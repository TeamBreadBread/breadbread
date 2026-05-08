export const APP_SHELL_MAX_WIDTH = "max-w-[744px]";
export const MOBILE_BASE_MAX_WIDTH = "max-w-[402px]";
export const MOBILE_BASE_MIN_HEIGHT = "min-h-[874px]";
export const RESPONSIVE_FRAME_WIDTH = "w-full max-w-[402px] md:max-w-[744px]";

/** `globals.css` body safe-top 과 맞춰 노치 아래에 고정 */
export const FIXED_TOP_BAR_TOP_CLASS = "top-[max(env(safe-area-inset-top),0px)]";

/** 프레임 가운데 정렬 고정 상단바 (배경·보더·내부 `h-14` 행은 각 컴포넌트에서) */
export const FIXED_TOP_BAR_FRAME_CLASS = `fixed left-1/2 z-[45] w-full -translate-x-1/2 ${FIXED_TOP_BAR_TOP_CLASS}`;

/**
 * 고정 상단바(`h-14`) 바로 아래로 스크롤 영역을 밀기 — `AppTopBar` 등이 스페이서로 함께 렌더링합니다.
 */
export const FIXED_TOP_BAR_SPACER_CLASS = "pointer-events-none h-14 w-full shrink-0";

/** 빵터 등 고정 헤더만 두고 본문에 패딩 줄 때 (56px == `h-14`) — 스페이서 대신 사용 가능 */
export const FIXED_TOP_BAR_BODY_OFFSET_CLASS = "pt-14";

/** 빵터·코스 상단바 공통 외곽 (내부에 `h-[56px]` 행) */
export const BBANGTEO_FIXED_HEADER_OUTER_CLASS = `${FIXED_TOP_BAR_FRAME_CLASS} ${RESPONSIVE_FRAME_WIDTH} border-b border-[#eeeff1] bg-white`;
