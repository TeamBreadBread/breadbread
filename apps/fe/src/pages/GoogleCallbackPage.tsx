import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getErrorMessage } from "@/api/types/common";
import { beginAuthEstablishment, abortAuthEstablishment } from "@/lib/auth/authSessionGate";
import { completeSocialLogin } from "@/lib/completeSocialLogin";
import {
  clearGoogleOAuthSession,
  exchangeGoogleSocialLogin,
  readGooglePkceSession,
} from "@/lib/googleOAuth";
import { googleOAuthRedirectUri } from "@/utils/frontBase";
import MobileFrame from "@/components/layout/MobileFrame";

const PREFIX = "google";

type Props = {
  code?: string;
  error?: string;
  error_description?: string;
  returnedState?: string;
};

export default function GoogleCallbackPage(props: Props) {
  const navigate = useNavigate();
  const [message, setMessage] = useState(() =>
    props.error
      ? (props.error_description ?? props.error ?? "구글 로그인이 취소되었습니다.")
      : "구글 로그인 처리 중…",
  );

  useEffect(() => {
    async function exchange() {
      if (props.error) {
        clearGoogleOAuthSession();
        return;
      }

      const code = props.code?.trim();
      if (!code) {
        clearGoogleOAuthSession();
        setMessage("인가 코드가 없습니다. 로그인을 다시 시도해 주세요.");
        return;
      }

      const session = readGooglePkceSession();
      if (!session) {
        setMessage("로그인 세션이 만료되었습니다. 처음부터 다시 시도해 주세요.");
        return;
      }

      if (props.returnedState !== undefined && props.returnedState !== session.state) {
        clearGoogleOAuthSession();
        setMessage("잘못된 로그인 요청입니다. 처음부터 다시 시도해 주세요.");
        return;
      }

      try {
        beginAuthEstablishment();
        const tokens = await exchangeGoogleSocialLogin({
          code,
          codeVerifier: session.codeVerifier,
          state: session.state || undefined,
        });
        clearGoogleOAuthSession();
        await completeSocialLogin(tokens, navigate, PREFIX);
      } catch (e) {
        abortAuthEstablishment(e);
        clearGoogleOAuthSession();
        setMessage(getErrorMessage(e));
      }
    }

    void exchange();
  }, [props.code, props.error, props.error_description, props.returnedState, navigate]);

  return (
    <MobileFrame>
      <main className="flex flex-1 flex-col items-center justify-center gap-x4 px-x5 py-x16 text-center text-size-4 text-gray-800">
        <p>{message}</p>
        {import.meta.env.DEV && message !== "구글 로그인 처리 중…" ? (
          <p className="max-w-full break-all text-size-3 text-gray-500">
            Redirect URI: {googleOAuthRedirectUri()}
          </p>
        ) : null}
        {props.error !== undefined || message !== "구글 로그인 처리 중…" ? (
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
