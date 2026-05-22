import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getErrorMessage } from "@/api/types/common";
import { completeSocialLogin } from "@/lib/completeSocialLogin";
import {
  clearNaverOAuthSession,
  exchangeNaverSocialLogin,
  readNaverOAuthSession,
} from "@/lib/naverOAuth";
import { naverOAuthRedirectUri } from "@/utils/frontBase";
import MobileFrame from "@/components/layout/MobileFrame";

const PREFIX = "naver";

type Props = {
  code?: string;
  error?: string;
  error_description?: string;
  returnedState?: string;
};

export default function NaverCallbackPage(props: Props) {
  const navigate = useNavigate();
  const [message, setMessage] = useState(() =>
    props.error
      ? (props.error_description ?? props.error ?? "네이버 로그인이 취소되었습니다.")
      : "네이버 로그인 처리 중…",
  );

  useEffect(() => {
    async function exchange() {
      if (props.error) {
        clearNaverOAuthSession();
        return;
      }

      const code = props.code?.trim();
      if (!code) {
        clearNaverOAuthSession();
        setMessage("인가 코드가 없습니다. 로그인을 다시 시도해 주세요.");
        return;
      }

      const session = readNaverOAuthSession();
      if (!session) {
        setMessage("로그인 세션이 만료되었습니다. 처음부터 다시 시도해 주세요.");
        return;
      }

      if (props.returnedState !== undefined && props.returnedState !== session.state) {
        clearNaverOAuthSession();
        setMessage("잘못된 로그인 요청입니다. 처음부터 다시 시도해 주세요.");
        return;
      }

      try {
        const tokens = await exchangeNaverSocialLogin({
          code,
          state: session.state,
        });
        clearNaverOAuthSession();
        await completeSocialLogin(tokens, navigate, PREFIX);
      } catch (e) {
        clearNaverOAuthSession();
        setMessage(getErrorMessage(e));
      }
    }

    void exchange();
  }, [props.code, props.error, props.error_description, props.returnedState, navigate]);

  return (
    <MobileFrame>
      <main className="flex flex-1 flex-col items-center justify-center gap-x4 px-x5 py-x16 text-center text-size-4 text-gray-800">
        <p>{message}</p>
        {import.meta.env.DEV && message !== "네이버 로그인 처리 중…" ? (
          <p className="max-w-full break-all text-size-3 text-gray-500">
            Redirect URI: {naverOAuthRedirectUri()}
          </p>
        ) : null}
        {props.error !== undefined || message !== "네이버 로그인 처리 중…" ? (
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
