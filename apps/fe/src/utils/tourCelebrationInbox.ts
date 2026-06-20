const TOUR_CELEBRATION_INBOX_KEY = "breadbot:tourCelebrationInbox";

export type TourCelebrationRecord = {
  id: string;
  courseId: number;
  courseName: string;
  message: string;
  completedAt: string;
};

function readRawRecords(): TourCelebrationRecord[] {
  try {
    const raw = localStorage.getItem(TOUR_CELEBRATION_INBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is TourCelebrationRecord =>
        item != null &&
        typeof item === "object" &&
        typeof (item as TourCelebrationRecord).id === "string" &&
        typeof (item as TourCelebrationRecord).courseId === "number" &&
        typeof (item as TourCelebrationRecord).courseName === "string" &&
        typeof (item as TourCelebrationRecord).message === "string" &&
        typeof (item as TourCelebrationRecord).completedAt === "string",
    );
  } catch {
    return [];
  }
}

function writeRawRecords(records: TourCelebrationRecord[]): void {
  try {
    localStorage.setItem(TOUR_CELEBRATION_INBOX_KEY, JSON.stringify(records));
  } catch {
    /* ignore */
  }
}

export function saveTourCelebrationRecord(input: {
  courseId: number;
  courseName: string;
  message: string;
  completedAt?: string;
}): void {
  if (input.courseId <= 0) return;

  const records = readRawRecords();
  const completedAt = input.completedAt ?? new Date().toISOString();
  const duplicate = records.find(
    (record) => record.courseId === input.courseId && record.completedAt === completedAt,
  );
  if (duplicate) return;

  const nextRecord: TourCelebrationRecord = {
    id: `celebration-${input.courseId}-${Date.now()}`,
    courseId: input.courseId,
    courseName: input.courseName.trim() || "오늘의 빵 투어",
    message: input.message,
    completedAt,
  };

  writeRawRecords([nextRecord, ...records]);
}

export function readTourCelebrationRecords(): TourCelebrationRecord[] {
  return readRawRecords().sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );
}
