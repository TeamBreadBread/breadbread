import { useEffect } from "react";

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share?: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
      Link?: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

export function useBreadBtiKakaoSdk() {
  const kakaoJsKey = import.meta.env.VITE_KAKAO_JS_KEY || import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;

  useEffect(() => {
    if (!kakaoJsKey) return;

    const initializeKakao = () => {
      if (!window.Kakao) return;
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(kakaoJsKey);
      }
    };

    if (window.Kakao) {
      initializeKakao();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js";
    script.async = true;
    script.onload = initializeKakao;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [kakaoJsKey]);

  return kakaoJsKey;
}

export function sendBreadBtiKakaoShare(payload: Record<string, unknown>, shareUrl: string) {
  if (!window.Kakao || !window.Kakao.isInitialized()) {
    window.alert("카카오 SDK 초기화가 아직 안 됐어요.");
    return;
  }

  if (window.Kakao.Share?.sendDefault) {
    window.Kakao.Share.sendDefault(payload);
    return;
  }

  if (window.Kakao.Link?.sendDefault) {
    window.Kakao.Link.sendDefault(payload);
    return;
  }

  const fallbackUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(shareUrl)}`;
  window.open(fallbackUrl, "_blank", "noopener,noreferrer");
}

export async function copyBreadBtiLink(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
    return;
  } catch {
    const tempInput = document.createElement("textarea");
    tempInput.value = url;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
  }
}

export function openBreadBtiShareWindow(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
