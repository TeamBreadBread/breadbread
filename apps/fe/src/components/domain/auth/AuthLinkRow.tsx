interface AuthLinkRowProps {
  leftText: string;
  rightText: string;
}

export default function AuthLinkRow({ leftText, rightText }: AuthLinkRowProps) {
  return (
    <div className="flex items-center justify-center gap-x3">
      <button
        type="button"
        className="whitespace-nowrap text-size-3 font-medium leading-t4 tracking-[-0.1px] text-gray-700"
      >
        {leftText}
      </button>

      <span className="whitespace-nowrap text-size-3 font-normal leading-t4 tracking-[-0.1px] text-gray-500">
        |
      </span>

      <button
        type="button"
        className="whitespace-nowrap text-size-3 font-medium leading-t4 tracking-[-0.1px] text-gray-700"
      >
        {rightText}
      </button>
    </div>
  );
}
