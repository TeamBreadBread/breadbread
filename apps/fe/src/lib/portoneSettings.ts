const LS_STORE = "breadbread_portone_store_id";
const LS_CHANNEL = "breadbread_portone_channel_key";

/** 브라우저 SDK용 — API Secret은 서버 `PORTONE_API_SECRET`에만 두세요. */
export type PortOneBrowserOverrides = {
  storeId: string;
  channelKey: string;
};

export function getPortOneBrowserOverrides(): PortOneBrowserOverrides {
  if (typeof localStorage === "undefined") {
    return { storeId: "", channelKey: "" };
  }
  return {
    storeId: localStorage.getItem(LS_STORE)?.trim() ?? "",
    channelKey: localStorage.getItem(LS_CHANNEL)?.trim() ?? "",
  };
}

export function setPortOneBrowserOverrides(next: PortOneBrowserOverrides) {
  if (typeof localStorage === "undefined") {
    return;
  }
  if (next.storeId.trim()) {
    localStorage.setItem(LS_STORE, next.storeId.trim());
  } else {
    localStorage.removeItem(LS_STORE);
  }
  if (next.channelKey.trim()) {
    localStorage.setItem(LS_CHANNEL, next.channelKey.trim());
  } else {
    localStorage.removeItem(LS_CHANNEL);
  }
}

export function getVitePortOneDefaults(): PortOneBrowserOverrides {
  const storeId =
    typeof import.meta.env.VITE_PORTONE_STORE_ID === "string"
      ? import.meta.env.VITE_PORTONE_STORE_ID.trim()
      : "";
  const channelKey =
    typeof import.meta.env.VITE_PORTONE_CHANNEL_KEY === "string"
      ? import.meta.env.VITE_PORTONE_CHANNEL_KEY.trim()
      : "";
  return { storeId, channelKey };
}

/**
 * 병합 우선순위: `VITE_PORTONE_*` → prepare 응답(서버 설정) → 브라우저 저장값.
 * 예전에 모달에서 저장한 localStorage가 있으면 .env보다 앞서면 안 되므로 env가 최우선입니다.
 */
export function resolvePortOneBrowserKeys(prepare: {
  storeId: string | null | undefined;
  channelKey: string | null | undefined;
}): { storeId: string; channelKey: string } {
  const fromPrepare = {
    storeId: prepare.storeId?.trim() ?? "",
    channelKey: prepare.channelKey?.trim() ?? "",
  };
  const fromVite = getVitePortOneDefaults();
  const fromLs = getPortOneBrowserOverrides();
  return {
    storeId: fromVite.storeId || fromPrepare.storeId || fromLs.storeId,
    channelKey: fromVite.channelKey || fromPrepare.channelKey || fromLs.channelKey,
  };
}
