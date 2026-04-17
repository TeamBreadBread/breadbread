interface FieldLabelProps {
  children: React.ReactNode;
}

export default function FieldLabel({ children }: FieldLabelProps) {
  return <label className="font-pretendard typo-t4medium text-gray-1000">{children}</label>;
}
