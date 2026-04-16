interface AuthTextLinkProps {
  text: string;
  onClick?: () => void;
}

export default function AuthTextLink({ text, onClick }: AuthTextLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-center text-[14px] font-medium leading-[19px] tracking-[0] text-[#868b94] underline"
    >
      {text}
    </button>
  );
}
