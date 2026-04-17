interface TextFieldProps {
  placeholder?: string;
  value?: string;
  trailingIcon?: React.ReactNode;
  onChange?: (value: string) => void;
  blockKorean?: boolean;
  error?: boolean;
}

export default function TextField({
  placeholder,
  value,
  trailingIcon,
  onChange,
  blockKorean = false,
  error = false,
}: TextFieldProps) {
  const handleChange = (nextValue: string) => {
    const sanitizedValue = blockKorean ? nextValue.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, "") : nextValue;

    onChange?.(sanitizedValue);
  };

  return (
    <div className="relative flex w-full items-center">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        aria-invalid={error}
        className={`font-pretendard typo-t5regular w-full rounded-r3 border bg-gray-00 px-x4 py-x3 text-gray-1000 placeholder-gray-600 outline-none focus:ring-0 ${error ? "border-[color:var(--color-red-700)] focus:border-[color:var(--color-red-700)]" : "border-gray-300 focus:border-gray-300"}`}
      />
      {trailingIcon && <div className="absolute right-x4 text-gray-700">{trailingIcon}</div>}
    </div>
  );
}
