import { useNavigate } from "@tanstack/react-router";
import MobileFrame from "@/components/layout/MobileFrame";
import { BottomCTA } from "@/components/common";
import SignupWelcomeSection from "@/components/domain/auth/SignupWelcomeSection";

export default function SignupResultPage() {
  const navigate = useNavigate();
  const userName = "유민진";

  const handleLoginClick = () => {
    navigate({ to: "/login" });
  };

  return (
    <MobileFrame>
      <main className="flex min-h-screen flex-col bg-white">
        <SignupWelcomeSection name={userName} />

        <BottomCTA text="로그인 하러가기" disabled={false} onClick={handleLoginClick} />
      </main>
    </MobileFrame>
  );
}
