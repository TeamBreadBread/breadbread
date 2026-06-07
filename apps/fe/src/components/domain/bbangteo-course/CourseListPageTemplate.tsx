import { useEffect, useMemo, useState } from "react";
import { getCourses, type CourseSummaryItem } from "@/api/courses";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import CourseFilterBar from "./CourseFilterBar";
import CourseList from "./CourseList";
import CoursePageHeader from "./CoursePageHeader";
import {
  buildCourseCatalogParams,
  getFilterOptionsForMode,
  type CourseCatalogMode,
} from "./courseCatalogFilters";
import { filterCoursesByCompanionTheme } from "./courseThemeFilter";

type CourseListPageTemplateProps = {
  title: string;
  mode: CourseCatalogMode;
};

const CourseListPageTemplate = ({ title, mode }: CourseListPageTemplateProps) => {
  const [filterValue, setFilterValue] = useState<string | undefined>();
  const [courses, setCourses] = useState<CourseSummaryItem[]>([]);
  const [loadedQueryKey, setLoadedQueryKey] = useState<string | null>(null);

  const filterOptions = useMemo(() => getFilterOptionsForMode(mode), [mode]);
  const apiFilterValue = mode === "theme" ? undefined : filterValue;
  const queryParams = useMemo(
    () => buildCourseCatalogParams(mode, apiFilterValue),
    [mode, apiFilterValue],
  );
  const queryKey = useMemo(() => JSON.stringify(queryParams), [queryParams]);
  const loading = loadedQueryKey !== queryKey;

  const displayedCourses = useMemo(() => {
    if (mode !== "theme" || !filterValue) return courses;
    return filterCoursesByCompanionTheme(courses, filterValue);
  }, [courses, filterValue, mode]);

  useEffect(() => {
    let cancelled = false;

    void getCourses(queryParams)
      .then((response) => {
        if (!cancelled) setCourses(response.courses ?? []);
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      })
      .finally(() => {
        if (!cancelled) setLoadedQueryKey(queryKey);
      });

    return () => {
      cancelled = true;
    };
  }, [queryParams, queryKey]);

  return (
    <MobileFrame className="bg-[#f3f4f5]">
      <div className="flex min-h-screen flex-1 flex-col bg-[#f3f4f5]">
        <CoursePageHeader title={title} />
        <div className="flex flex-1 flex-col">
          <CourseFilterBar
            options={filterOptions}
            activeValue={filterValue}
            onChange={setFilterValue}
          />
          <CourseList courses={displayedCourses} loading={loading} />
        </div>
      </div>
      <BottomNav />
    </MobileFrame>
  );
};

export default CourseListPageTemplate;
