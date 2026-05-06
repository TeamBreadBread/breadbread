import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getErrorMessage } from "@/api/types/common";
import { socialLogin, setSessionTokens } from "@/api/auth";
import { kakaoOAuthRedirectUri } from "@/utils/frontBase";
import { clearKakaoPkceSession, readKakaoPkceSession } from "@/lib/kakaoOAuth";
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
    async function exchange() {
      if (props.error) {
        clearKakaoPkceSession();
        return;
      }

      const code = props.code;
      if (!code?.trim()) {
        clearKakaoPkceSession();
        setMessage("인가 코드가 없습니다. 로그인을 다시 시도해 주세요.");
        return;
      }

      const session = readKakaoPkceSession();
      if (!session) {
        setMessage(
          "로그인 세션이 만료되었습니다. 카카오로 그만하기 버튼을 두 번 누르지 않았는지 확인한 뒤 다시 시도해 주세요.",
        );
        return;
      }

      if (props.returnedState !== undefined && props.returnedState !== session.state) {
        clearKakaoPkceSession();
        setMessage("잘못된 로그인 요청입니다. 처음부터 다시 시도해 주세요.");
        return;
      }

      try {
        const redirectUri = kakaoOAuthRedirectUri();
        const tokens = await socialLogin("KAKAO", {
          code,
          redirectUri,
          codeVerifier: session.codeVerifier,
          state: session.state || undefined,
        });
        clearKakaoPkceSession();
        setSessionTokens(tokens);
        await navigate({ to: "/user-preference" });
      } catch (e) {
        clearKakaoPkceSession();
        setMessage(getErrorMessage(e));
      }
    }

    void exchange();
  }, [props.code, props.error, props.error_description, props.returnedState, navigate]);

  return (
    <MobileFrame>
      <main className="flex flex-1 flex-col items-center justify-center gap-x4 px-x5 py-x16 text-center text-size-4 text-gray-800">
        <p>{message}</p>
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
