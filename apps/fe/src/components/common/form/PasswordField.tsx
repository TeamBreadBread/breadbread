import { PasswordToggleIcon } from "@/components/icons";
import { useRef, useState } from "react";

const HANGUL_PATTERN = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/g;

function stripHangul(value: string): string {
  return value.replace(HANGUL_PATTERN, "");
}

interface PasswordFieldProps {
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
  borderClassName?: string;
  autoComplete?: string;
}

export default function PasswordField({
  placeholder,
  value,
  onChange,
  borderClassName = "border-gray-400",
  autoComplete,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const isComposingRef = useRef(false);

  const emitValue = (nextValue: string) => {
    onChange?.(isComposingRef.current ? nextValue : stripHangul(nextValue));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    emitValue(event.target.value);
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (event: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    emitValue(event.currentTarget.value);
  };

  return (
    <div
      className={`flex h-14 items-center gap-x2 rounded-r3 border bg-gray-00 px-x5 ${borderClassName}`}
    >
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        lang="en"
        className="typo-t5regular min-w-0 flex-1 bg-transparent text-gray-1000 outline-none placeholder-gray-500"
      />
      <button
        type="button"
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
        onMouseDown={(event) => event.preventDefault()}
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
