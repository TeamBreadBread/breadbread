const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID ?? "G-VVHS24Q0M9";

const FIRST_ACTION_PENDING_KEY = "ga4:first_action_after_login_pending";
const DEDUPE_WINDOW_MS = 1000;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;
const dedupeTimestamps = new Map<string, number>();

type Ga4EventParams = Record<string, string | number | boolean | undefined>;

function isLocalhost(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

function isGtagEnabled(): boolean {
  return Boolean(GA4_MEASUREMENT_ID?.trim());
}

/** 프로덕션 + localhost가 아닐 때만 GA4 전송 */
export function isAnalyticsEnabled(): boolean {
  return isGtagEnabled() && !import.meta.env.DEV && !isLocalhost();
}

function shouldSendEvent(dedupeKey: string): boolean {
  const now = Date.now();
  const lastSentAt = dedupeTimestamps.get(dedupeKey);
  if (lastSentAt != null && now - lastSentAt < DEDUPE_WINDOW_MS) {
    return false;
  }
  dedupeTimestamps.set(dedupeKey, now);
  return true;
}

function cleanParams(params?: Ga4EventParams): Record<string, string | number | boolean> {
  if (!params) return {};
  return Object.fromEntries(
    Object.entries(params).filter((entry): entry is [string, string | number | boolean] => {
      return entry[1] !== undefined;
    }),
  );
}

function sendGa4Event(eventName: string, params?: Ga4EventParams, dedupeKey?: string): void {
  if (!isAnalyticsEnabled()) return;
  if (!initialized) initGtag();
  if (!window.gtag) return;

  const key = dedupeKey ?? eventName;
  if (!shouldSendEvent(key)) return;

  window.gtag("event", eventName, cleanParams(params));
}

export function initGtag(): void {
  if (initialized || typeof window === "undefined" || !isAnalyticsEnabled()) return;

  initialized = true;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", GA4_MEASUREMENT_ID, { send_page_view: false });
}

export function trackGtagPageView(path: string): void {
  if (!isAnalyticsEnabled()) return;
  if (!initialized) initGtag();
  if (!window.gtag) return;

  window.gtag("config", GA4_MEASUREMENT_ID, {
    page_path: path,
  });
}

export function getGa4MeasurementId(): string | undefined {
  return isGtagEnabled() ? GA4_MEASUREMENT_ID : undefined;
}

export function markGa4FirstActionAfterLoginPending(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(FIRST_ACTION_PENDING_KEY, "1");
}

export function clearGa4FirstActionAfterLoginPending(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(FIRST_ACTION_PENDING_KEY);
}

function isGa4FirstActionAfterLoginPending(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(FIRST_ACTION_PENDING_KEY) === "1";
}

export function trackGa4FirstActionAfterLogin(buttonName: string): void {
  if (!isGa4FirstActionAfterLoginPending()) return;
  clearGa4FirstActionAfterLoginPending();
  sendGa4Event("first_action_after_login", { button_name: buttonName }, "first_action_after_login");
}

export function bindGa4FirstActionAfterLoginListener(): () => void {
  if (typeof document === "undefined") return () => undefined;

  const handleClick = (event: MouseEvent) => {
    if (!isGa4FirstActionAfterLoginPending()) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const clickable = target.closest("button, a[href], [role='button']");
    if (!clickable) return;

    const buttonName =
      clickable.getAttribute("aria-label")?.trim() ||
      clickable.getAttribute("data-ga-button-name")?.trim() ||
      clickable.textContent?.replace(/\s+/g, " ").trim().slice(0, 80) ||
      "unknown";

    trackGa4FirstActionAfterLogin(buttonName);
  };

  document.addEventListener("click", handleClick, true);
  return () => document.removeEventListener("click", handleClick, true);
}

export function trackAiCourseRegenerated(): void {
  sendGa4Event("ai_course_regenerated");
}

export function trackRouteDetailViewed(courseId: number): void {
  sendGa4Event("route_detail_viewed", { course_id: courseId }, `route_detail_viewed:${courseId}`);
}

export function trackTourStarted(courseId: number): void {
  sendGa4Event("tour_started", { course_id: courseId }, `tour_started:${courseId}`);
}

export function trackBakeryVisitChecked(courseId: number, order: number): void {
  sendGa4Event(
    "bakery_visit_checked",
    { course_id: courseId, visit_order: order },
    `bakery_visit_checked:${courseId}:${order}`,
  );
}

export function trackTourCompleted(courseId: number): void {
  sendGa4Event("tour_completed", { course_id: courseId }, `tour_completed:${courseId}`);
}

export function trackCuratorOpened(): void {
  sendGa4Event("curator_opened");
}

export function trackCuratorGuideClicked(guideLabel: string): void {
  sendGa4Event(
    "curator_guide_clicked",
    { guide_label: guideLabel },
    `curator_guide_clicked:${guideLabel}`,
  );
}

export function trackRouteLinkCopied(courseId: string): void {
  sendGa4Event("route_link_copied", { course_id: courseId }, `route_link_copied:${courseId}`);
}

export function trackRouteShared(courseId: string, shareMethod: "native" | "kakao_scheme"): void {
  sendGa4Event(
    "route_shared",
    { course_id: courseId, share_method: shareMethod },
    `route_shared:${courseId}:${shareMethod}`,
  );
}
