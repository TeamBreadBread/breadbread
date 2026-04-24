interface PasswordFieldProps {
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
  borderClassName?: string;
}

export default function PasswordField({
  placeholder,
  value,
  onChange,
  borderClassName = "border-gray-400",
}: PasswordFieldProps) {
  // 한글(자모 포함) 입력 방지
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // 한글(자모 포함) 정규식: [\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]
    const filtered = inputValue.replace(/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/g, "");
    onChange?.(filtered);
  };
  return (
    <div className={`flex h-14 items-center rounded-r3 border bg-gray-00 px-x5 ${borderClassName}`}>
      <input
        type="password"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="typo-t5regular flex-1 bg-transparent text-gray-1000 outline-none placeholder-gray-500"
      />
    </div>
  );
}
