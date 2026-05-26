import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/api/types/common";
import { getLikedCourses, type LikedCoursesResponse } from "@/api/user";
import { AppTopBar } from "@/components/common";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import { useNavigate } from "@tanstack/react-router";

const PAGE_SIZE = 10;

function formatPrice(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function LikedCoursesPage() {
  const navigate = useNavigate();
  const [response, setResponse] = useState<LikedCoursesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (page: number, append: boolean) => {
    try {
      setError("");
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      const data = await getLikedCourses({ page, size: PAGE_SIZE });
      setResponse((prev) => {
        if (!append || !prev) return data;
        return {
          ...data,
          courses: [...prev.courses, ...data.courses],
        };
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(0, false);
  }, [loadPage]);

  const courses = response?.courses ?? [];

  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col bg-[#f3f4f5]">
        <AppTopBar
          title="좋아요한 코스"
          centered
          showBackButton
          onBackClick={() => navigate({ to: "/my" })}
        />

        <main className="flex flex-1 flex-col gap-x4 px-x5 py-x6 pb-[calc(56px+24px)] sm:pb-[calc(72px+24px)]">
          {isLoading ? (
            <p className="typo-t4regular text-gray-700">코스를 불러오는 중이에요.</p>
          ) : null}
          {error ? (
            <p className="typo-t4regular text-[color:var(--color-red-700)]">{error}</p>
          ) : null}
          {!isLoading && !error && courses.length === 0 ? (
            <div className="rounded-r4 bg-white px-x5 py-x6">
              <p className="typo-t4medium text-gray-1000">아직 좋아요한 코스가 없어요.</p>
            </div>
          ) : null}

          {courses.map((course) => (
            <article key={course.id} className="rounded-r4 bg-white px-x5 py-x5">
              <div className="flex items-start justify-between gap-x3">
                <div>
                  <p className="typo-t4bold text-gray-1000">{course.name}</p>
                  <p className="mt-x1 typo-t3regular text-gray-700">
                    빵집 {course.bakeryCount}곳 · {course.estimatedTime} · 예상{" "}
                    {formatPrice(course.estimatedCost)}원
                  </p>
                </div>
                <span className="rounded-full bg-[#fff1f0] px-x3 py-x1 typo-t3medium text-[#d2451e]">
                  좋아요 {course.likeCount}
                </span>
              </div>

              <div className="mt-x4 flex flex-wrap gap-x2 gap-y2">
                {course.bakeries.map((bakery) => (
                  <span
                    key={bakery.id}
                    className="rounded-full bg-[#f3f4f5] px-x3 py-x1 typo-t3regular text-gray-800"
                  >
                    {bakery.name}
                  </span>
                ))}
              </div>

              <p className="mt-x4 typo-t3regular text-gray-700">
                {course.saved ? "저장한 코스예요." : "좋아요한 코스예요."}
              </p>
            </article>
          ))}

          {response?.hasNext ? (
            <button
              type="button"
              className="rounded-r3 border border-gray-300 bg-white px-x5 py-x4 typo-t4bold text-gray-1000 disabled:opacity-50"
              disabled={isLoadingMore}
              onClick={() => void loadPage((response?.page ?? 0) + 1, true)}
            >
              {isLoadingMore ? "불러오는 중…" : "더 보기"}
            </button>
          ) : null}
        </main>
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
