interface MobileFrameProps {
  children: React.ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="flex h-screen w-full max-w-[744px] flex-col mx-auto bg-gray-00">{children}</div>
  );
}
