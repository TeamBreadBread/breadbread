import { useCallback, useRef, useState } from "react";
import CourseTransportBottomSheet from "@/components/domain/course/CourseTransportBottomSheet";
import type { CourseTransportMode } from "@/lib/courseTransportMode";

/** 코스 시작 전 이동 수단 선택 바텀시트 */
export function useCourseTransportSheet() {
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<((mode: CourseTransportMode | null) => void) | null>(null);

  const pickTransportMode = useCallback((): Promise<CourseTransportMode | null> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setOpen(true);
    });
  }, []);

  const handleSelect = useCallback((mode: CourseTransportMode) => {
    setOpen(false);
    resolverRef.current?.(mode);
    resolverRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    resolverRef.current?.(null);
    resolverRef.current = null;
  }, []);

  const transportSheet = (
    <CourseTransportBottomSheet open={open} onClose={handleClose} onSelect={handleSelect} />
  );

  return { pickTransportMode, transportSheet };
}
