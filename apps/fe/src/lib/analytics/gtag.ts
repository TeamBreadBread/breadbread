const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID ?? "G-VVHS24Q0M9";

const FIRST_ACTION_PENDING_KEY = "ga4:first_action_after_login_pending";
const DEDUPE_WINDOW_MS = 1000;
const GTAG_SCRIPT_SELECTOR = 'script[src*="googletagmanager.com/gtag/js"]';

let initialized = false;
let initPromise: Promise<void> | null = null;
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

/** 프로덕션 빌드 + localhost가 아닐 때만 GA4 전송 */
export function isAnalyticsEnabled(): boolean {
  return isGtagEnabled() && import.meta.env.PROD && !isLocalhost();
}

function isGaDebugMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("ga_debug");
}

function hasGtagScriptElement(): boolean {
  return typeof document !== "undefined" && document.querySelector(GTAG_SCRIPT_SELECTOR) != null;
}

/** Google 공식 스니펫과 동일 — arguments 객체를 dataLayer에 push해야 gtag.js가 처리한다 */
function ensureGtagStub(): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer ?? [];

  if (typeof window.gtag === "function") return;

  // gtag.js는 Arguments 객체 형식의 dataLayer 큐만 처리한다 (rest params 배열은 collect 미발생)
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params -- GA4 공식 스니펫과 동일하게 arguments push 필요
    window.dataLayer?.push(arguments);
  } as Window["gtag"];
}

function invokeGtag(command: Gtag.GtagCommand, ...args: unknown[]): void {
  if (!window.gtag) return;
  (window.gtag as (...params: unknown[]) => void)(command, ...args);
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

function applyDebugModeIfRequested(): void {
  if (!isGaDebugMode()) return;
  invokeGtag("config", GA4_MEASUREMENT_ID, { debug_mode: true });
}

function waitForGtagScript(timeoutMs = 10_000): Promise<void> {
  if (hasGtagScriptElement()) {
    const script = document.querySelector<HTMLScriptElement>(GTAG_SCRIPT_SELECTOR);
    if (
      script &&
      (script.dataset.loaded === "true" || script.getAttribute("data-loaded") === "true")
    ) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      if (!script) {
        resolve();
        return;
      }

      const finish = () => {
        script.dataset.loaded = "true";
        resolve();
      };

      if (script.dataset.loaded === "true") {
        resolve();
        return;
      }

      script.addEventListener("load", finish, { once: true });
      script.addEventListener("error", finish, { once: true });

      // index.html async 스크립트가 이미 로드된 경우 load 이벤트가 재발생하지 않음
      if (document.readyState === "complete") {
        window.setTimeout(finish, 50);
      }

      window.setTimeout(finish, timeoutMs);
    });
  }

  return new Promise((resolve) => {
    ensureGtagStub();

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;

    const finish = () => {
      script.dataset.loaded = "true";
      resolve();
    };

    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", finish, { once: true });
    document.head.appendChild(script);

    invokeGtag("js", new Date());
    invokeGtag("config", GA4_MEASUREMENT_ID, { send_page_view: false });

    window.setTimeout(finish, timeoutMs);
  });
}

export function initGtag(): Promise<void> {
  if (typeof window === "undefined" || !isAnalyticsEnabled()) {
    return Promise.resolve();
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    ensureGtagStub();

    if (!hasGtagScriptElement()) {
      invokeGtag("js", new Date());
      invokeGtag("config", GA4_MEASUREMENT_ID, { send_page_view: false });
    }

    await waitForGtagScript();
    initialized = true;
    applyDebugModeIfRequested();
  })();

  return initPromise;
}

function sendGa4Event(eventName: string, params?: Ga4EventParams, dedupeKey?: string): void {
  if (!isAnalyticsEnabled()) return;

  void initGtag().then(() => {
    if (!window.gtag) return;

    const key = dedupeKey ?? eventName;
    if (!shouldSendEvent(key)) return;

    invokeGtag("event", eventName, cleanParams(params));
  });
}

export function trackGtagPageView(path: string): void {
  if (!isAnalyticsEnabled()) return;

  void initGtag().then(() => {
    if (!window.gtag) return;

    invokeGtag("event", "page_view", {
      page_path: path,
      page_location: `${window.location.origin}${path}`,
      page_title: document.title,
    });
  });
}

export function getGa4MeasurementId(): string | undefined {
  return isGtagEnabled() ? GA4_MEASUREMENT_ID : undefined;
}

export function isGa4Initialized(): boolean {
  return initialized;
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
