import { useCallback, useState } from "react";

import type { CourseDetail } from "@/api/courses";
import ClosedBakeryCourseDialog from "@/components/common/dialog/ClosedBakeryCourseDialog";
import { useCourseTransportSheet } from "@/hooks/useCourseTransportSheet";
import { saveCourseTransportMode } from "@/lib/courseTransportMode";
import {
  excludeClosedBakeryFromCourse,
  formatCourseMutationError,
  isEmptyCourseError,
  replaceClosedBakeryInCourse,
} from "@/utils/courseClosedDayActions";
import {
  findClosedBakeriesInCourse,
  type ClosedCourseBakery,
} from "@/utils/courseClosedDayValidation";

type UseCourseGuideStartOptions = {
  courseId: number | null | undefined;
  onCourseUpdated?: (detail: CourseDetail) => void;
  onStartGuide: () => Promise<void>;
};

export function useCourseGuideStart({
  courseId,
  onCourseUpdated,
  onStartGuide,
}: UseCourseGuideStartOptions) {
  const { pickTransportMode, transportSheet } = useCourseTransportSheet();
  const [closedDialogOpen, setClosedDialogOpen] = useState(false);
  const [closedBakeries, setClosedBakeries] = useState<ClosedCourseBakery[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const confirmTransportAndStart = useCallback(async () => {
    if (!courseId) return false;
    const mode = await pickTransportMode();
    if (!mode) return false;
    await saveCourseTransportMode(courseId, mode);
    await onStartGuide();
    return true;
  }, [courseId, onStartGuide, pickTransportMode]);

  const refreshClosedBakeries = useCallback(async (): Promise<ClosedCourseBakery[]> => {
    if (!courseId) return [];
    return findClosedBakeriesInCourse(courseId);
  }, [courseId]);

  const finishIfReady = useCallback(
    async (nextClosed: ClosedCourseBakery[]) => {
      if (nextClosed.length === 0) {
        setClosedDialogOpen(false);
        setClosedBakeries([]);
        setCurrentIndex(0);
        await confirmTransportAndStart();
        return;
      }
      setClosedBakeries(nextClosed);
      setCurrentIndex(0);
      setClosedDialogOpen(true);
    },
    [confirmTransportAndStart],
  );

  const requestCourseGuideStart = useCallback(async () => {
    if (!courseId) return;

    try {
      const closed = await refreshClosedBakeries();
      if (closed.length === 0) {
        await confirmTransportAndStart();
        return;
      }
      setClosedBakeries(closed);
      setCurrentIndex(0);
      setClosedDialogOpen(true);
    } catch {
      await confirmTransportAndStart();
    }
  }, [confirmTransportAndStart, courseId, refreshClosedBakeries]);

  const handleReplace = useCallback(async () => {
    if (!courseId || busy) return;
    const target = closedBakeries[currentIndex];
    if (!target) return;

    try {
      setBusy(true);
      const { detail, replacementName } = await replaceClosedBakeryInCourse(
        courseId,
        target.bakeryId,
      );
      onCourseUpdated?.(detail);
      if (replacementName) {
        window.alert(`${target.name}을(를) ${replacementName}(으)로 변경했습니다.`);
      }
      const nextClosed = await refreshClosedBakeries();
      await finishIfReady(nextClosed);
    } catch (error) {
      window.alert(formatCourseMutationError(error));
      if (isEmptyCourseError(error)) {
        setClosedDialogOpen(false);
      }
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    closedBakeries,
    courseId,
    currentIndex,
    finishIfReady,
    onCourseUpdated,
    refreshClosedBakeries,
  ]);

  const handleExclude = useCallback(async () => {
    if (!courseId || busy) return;
    const target = closedBakeries[currentIndex];
    if (!target) return;

    try {
      setBusy(true);
      const detail = await excludeClosedBakeryFromCourse(courseId, target.bakeryId);
      onCourseUpdated?.(detail);
      const nextClosed = await refreshClosedBakeries();
      await finishIfReady(nextClosed);
    } catch (error) {
      window.alert(formatCourseMutationError(error));
      if (isEmptyCourseError(error)) {
        setClosedDialogOpen(false);
      }
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    closedBakeries,
    courseId,
    currentIndex,
    finishIfReady,
    onCourseUpdated,
    refreshClosedBakeries,
  ]);

  const closedBakeryDialog = (
    <ClosedBakeryCourseDialog
      open={closedDialogOpen}
      closedBakeries={closedBakeries}
      currentIndex={currentIndex}
      busy={busy}
      onReplace={() => void handleReplace()}
      onExclude={() => void handleExclude()}
    />
  );

  return {
    requestCourseGuideStart,
    closedBakeryDialog,
    transportSheet,
  };
}
