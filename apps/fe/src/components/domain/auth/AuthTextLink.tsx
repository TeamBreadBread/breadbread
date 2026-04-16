interface AuthTextLinkProps {
  text: string;
  onClick?: () => void;
}

export default function AuthTextLink({ text, onClick }: AuthTextLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-center text-size-3 font-medium leading-t4 tracking-0 text-gray-700 underline"
    >
      {text}
    </button>
  );
}
