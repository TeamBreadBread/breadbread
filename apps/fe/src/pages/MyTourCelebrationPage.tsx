import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppTopBar } from "@/components/common";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import { readTourCelebrationRecords } from "@/utils/tourCelebrationInbox";

function formatCompletedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day} 완료`;
}

export default function MyTourCelebrationPage() {
  const navigate = useNavigate();
  const records = useMemo(() => readTourCelebrationRecords(), []);

  return (
    <MobileFrame>
      <AppTopBar title="코스 완료 축하 메시지함" onBack={() => navigate({ to: "/my" })} />
      <main className="flex min-h-0 flex-1 flex-col gap-x3 overflow-y-auto bg-gray-100 px-x5 pb-x24 pt-x4">
        {records.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-r4 bg-white px-x5 py-x8 text-center">
            <p className="typo-t4regular text-gray-600">
              아직 완료한 코스의 축하 메시지가 없어요.
              <br />빵 투어를 완주하면 이곳에 저장돼요!
            </p>
          </div>
        ) : (
          records.map((record) => (
            <article
              key={record.id}
              className="rounded-r4 bg-white px-x5 py-x5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
            >
              <div className="mb-x3 flex items-start justify-between gap-x3">
                <h2 className="typo-t4bold text-gray-1000">{record.courseName}</h2>
                <time className="shrink-0 typo-t3regular text-gray-600">
                  {formatCompletedDate(record.completedAt)}
                </time>
              </div>
              <p className="whitespace-pre-wrap typo-t4regular text-gray-900">{record.message}</p>
            </article>
          ))
        )}
      </main>
      <BottomNav />
    </MobileFrame>
  );
}
