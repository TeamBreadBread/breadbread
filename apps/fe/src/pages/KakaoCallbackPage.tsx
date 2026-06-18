import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ApiBusinessError, getErrorMessage } from "@/api/types/common";
import { setSessionTokens } from "@/api/auth";
import { beginAuthEstablishment, abortAuthEstablishment } from "@/lib/auth/authSessionGate";
import { finishLoginAndNavigate } from "@/lib/auth/resolvePostLoginRoute";
import { loginFlowLog, loginFlowTime, loginFlowTimeEnd } from "@/lib/auth/loginFlowTiming";
import { markGa4FirstActionAfterLoginPending } from "@/lib/analytics/gtag";
import { onAuthSessionEstablished } from "@/lib/fcm/setupFcm";
import { exchangeKakaoSocialLogin } from "@/lib/kakaoOAuth";
import { kakaoOAuthRedirectUri } from "@/utils/frontBase";
import {
  clearKakaoOAuthSession,
  clearKakaoPkceSession,
  consumeKakaoPostLoginRedirect,
  readKakaoPkceSession,
} from "@/lib/kakaoOAuth";
import MobileFrame from "@/components/layout/MobileFrame";

type Props = {
  code?: string;
  error?: string;
  error_description?: string;
  returnedState?: string;
};

export default function KakaoCallbackPage(props: Props) {
  const navigate = useNavigate();
  const [message, setMessage] = useState(() =>
    props.error
      ? (props.error_description ?? props.error ?? "카카오 로그인이 취소되었습니다.")
      : "카카오 로그인 처리 중…",
  );

  useEffect(() => {
    let cancelled = false;

    async function exchange() {
      loginFlowTime("kakao-callback-total");
      loginFlowLog("KakaoCallback mount / exchange start");

      if (props.error) {
        clearKakaoOAuthSession();
        loginFlowTimeEnd("kakao-callback-total");
        return;
      }

      const code = props.code;
      if (!code?.trim()) {
        clearKakaoOAuthSession();
        setMessage("인가 코드가 없습니다. 로그인을 다시 시도해 주세요.");
        loginFlowTimeEnd("kakao-callback-total");
        return;
      }

      const session = readKakaoPkceSession();
      if (!session) {
        setMessage(
          "로그인 세션이 만료되었습니다. 카카오로 그만하기 버튼을 두 번 누르지 않았는지 확인한 뒤 다시 시도해 주세요.",
        );
        loginFlowTimeEnd("kakao-callback-total");
        return;
      }

      if (props.returnedState !== undefined && props.returnedState !== session.state) {
        clearKakaoOAuthSession();
        setMessage("잘못된 로그인 요청입니다. 처음부터 다시 시도해 주세요.");
        loginFlowTimeEnd("kakao-callback-total");
        return;
      }

      try {
        loginFlowLog("beginAuthEstablishment");
        beginAuthEstablishment();

        loginFlowTime("exchangeKakaoSocialLogin");
        const tokens = await exchangeKakaoSocialLogin({
          code,
          codeVerifier: session.codeVerifier,
          state: session.state || undefined,
        });
        loginFlowTimeEnd("exchangeKakaoSocialLogin");
        if (cancelled) return;

        const postLogin = consumeKakaoPostLoginRedirect();
        clearKakaoPkceSession();

        loginFlowTime("setSessionTokens");
        setSessionTokens(tokens);
        loginFlowTimeEnd("setSessionTokens");
        if (cancelled) return;

        markGa4FirstActionAfterLoginPending();
        onAuthSessionEstablished();

        await finishLoginAndNavigate(navigate, postLogin);
        if (cancelled) return;

        loginFlowTimeEnd("kakao-callback-total");
      } catch (e) {
        if (cancelled) return;
        abortAuthEstablishment(e);
        clearKakaoOAuthSession();
        loginFlowTimeEnd("kakao-callback-total");
        const base = getErrorMessage(e);
        const isSocialFail = e instanceof ApiBusinessError && e.code === "E0113";
        setMessage(
          isSocialFail
            ? `${base} (Redirect URI는 콘솔·백엔드와 맞는 경우) Cloud Run의 KAKAO_CLIENT_ID(REST API 키)와 KAKAO_CLIENT_SECRET(카카오 로그인 Client Secret)을 확인해 주세요.`
            : base,
        );
      }
    }

    void exchange();

    return () => {
      cancelled = true;
    };
  }, [props.code, props.error, props.error_description, props.returnedState, navigate]);

  return (
    <MobileFrame>
      <main className="flex flex-1 flex-col items-center justify-center gap-x4 px-x5 py-x16 text-center text-size-4 text-gray-800">
        <p>{message}</p>
        {import.meta.env.DEV && message !== "카카오 로그인 처리 중…" ? (
          <p className="max-w-full break-all text-size-3 text-gray-500">
            Redirect URI: {kakaoOAuthRedirectUri()}
          </p>
        ) : null}
        {props.error !== undefined || message !== "카카오 로그인 처리 중…" ? (
          <button
            type="button"
            className="text-size-4 font-medium text-gray-900 underline underline-offset-2"
            onClick={() => void navigate({ to: "/" })}
          >
            로그인 화면으로
          </button>
        ) : null}
      </main>
    </MobileFrame>
  );
}
