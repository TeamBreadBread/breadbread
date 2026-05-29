import { PasswordToggleIcon } from "@/components/icons";
import { useState } from "react";

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
  const [visible, setVisible] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const filtered = inputValue.replace(/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/g, "");
    onChange?.(filtered);
  };

  return (
    <div
      className={`flex h-14 items-center gap-x2 rounded-r3 border bg-gray-00 px-x5 ${borderClassName}`}
    >
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="typo-t5regular min-w-0 flex-1 bg-transparent text-gray-1000 outline-none placeholder-gray-500"
      />
      <button
        type="button"
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
        onClick={() => setVisible((prev) => !prev)}
        className="flex shrink-0 items-center justify-center"
      >
        <PasswordToggleIcon
          visible={visible}
          className={visible ? "text-gray-900" : "text-gray-700"}
        />
      </button>
    </div>
  );
}
