import type { ButtonHTMLAttributes, ReactNode } from "react";

// 공통 버튼 기본 인터페이스. 추후 variant/size 확장 기준점으로 사용
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

const Button = ({ children, className, type = "button", ...rest }: ButtonProps) => {
  return (
    <button type={type} className={className} {...rest}>
      {children}
    </button>
  );
};

export default Button;
