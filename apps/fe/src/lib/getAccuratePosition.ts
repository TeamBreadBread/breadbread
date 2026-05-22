export type AccuratePosition = {
  latitude: number;
  longitude: number;
  /** 미터 단위 정확도(작을수록 좋음). `null`이면 브라우저가 제공하지 않음 */
  accuracy: number | null;
};

type GetAccuratePositionOptions = {
  /** 이 값(ms) 안에 가장 정확한 좌표를 반환 */
  maxWaitMs?: number;
  /** 이 정확도(미터) 이하이면 즉시 반환 */
  targetAccuracyM?: number;
};

const DEFAULT_MAX_WAIT_MS = 18_000;
const DEFAULT_TARGET_ACCURACY_M = 45;

function toResult(pos: GeolocationPosition): AccuratePosition {
  const { latitude, longitude, accuracy } = pos.coords;
  return {
    latitude,
    longitude,
    accuracy: Number.isFinite(accuracy) ? accuracy : null,
  };
}

function isBetterCandidate(next: GeolocationPosition, prev: GeolocationPosition | null): boolean {
  if (!prev) return true;
  const nextAcc = next.coords.accuracy;
  const prevAcc = prev.coords.accuracy;
  if (!Number.isFinite(nextAcc)) return false;
  if (!Number.isFinite(prevAcc)) return true;
  return nextAcc < prevAcc;
}

/**
 * GPS 좌표를 가능한 한 정확하게 수집합니다.
 * `watchPosition`으로 여러 샘플을 받은 뒤 가장 정확한 값을 사용합니다.
 */
export function getAccuratePosition(
  options: GetAccuratePositionOptions = {},
): Promise<AccuratePosition> {
  const maxWaitMs = options.maxWaitMs ?? DEFAULT_MAX_WAIT_MS;
  const targetAccuracyM = options.targetAccuracyM ?? DEFAULT_TARGET_ACCURACY_M;

  if (!navigator.geolocation) {
    return Promise.reject(new Error("이 브라우저에서는 위치 정보를 사용할 수 없습니다."));
  }

  const geoOptions: PositionOptions = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: maxWaitMs,
  };

  return new Promise((resolve, reject) => {
    let best: GeolocationPosition | null = null;
    let settled = false;

    const finish = (pos: GeolocationPosition) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(toResult(pos));
    };

    const fail = (error: GeolocationPositionError) => {
      if (settled) return;
      if (best) {
        finish(best);
        return;
      }
      settled = true;
      cleanup();
      reject(error);
    };

    const onPosition = (pos: GeolocationPosition) => {
      if (isBetterCandidate(pos, best)) {
        best = pos;
      }
      const acc = pos.coords.accuracy;
      if (Number.isFinite(acc) && acc <= targetAccuracyM) {
        finish(pos);
      }
    };

    const watchId = navigator.geolocation.watchPosition(onPosition, fail, geoOptions);

    const cleanup = () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(deadlineTimer);
    };

    const deadlineTimer = window.setTimeout(() => {
      if (settled) return;
      navigator.geolocation.clearWatch(watchId);
      if (best) {
        finish(best);
        return;
      }
      navigator.geolocation.getCurrentPosition((pos) => finish(pos), fail, geoOptions);
    }, maxWaitMs);
  });
}
