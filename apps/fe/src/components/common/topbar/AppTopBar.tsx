import { useEffect, useRef } from "react";

interface AppTopBarProps {
  title: string;
}

export default function AppTopBar({ title }: AppTopBarProps) {
  const titleRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const titleEl = titleRef.current;
    if (!titleEl) return;
    const style = window.getComputedStyle(titleEl);

    // #region agent log
    fetch("http://127.0.0.1:7527/ingest/47cb9a83-be89-41f5-956b-1d8c6ec48e8a", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "3c747c" },
      body: JSON.stringify({
        sessionId: "3c747c",
        runId: "pre-fix",
        hypothesisId: "H5",
        location: "AppTopBar.tsx:13",
        message: "Route header title computed typography",
        data: {
          className: titleEl.className,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          textAlign: style.textAlign,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-start border-b border-[#eeeff1] bg-white px-x5 py-x2_5">
      <span
        ref={titleRef}
        className="w-full text-left font-pretendard typo-t6bold text-size-6 font-bold leading-t6 tracking-[-0.1px] text-[#1a1c20]"
      >
        {title}
      </span>
    </header>
  );
}
