import { createFileRoute } from "@tanstack/react-router";
import HomePage from "@/pages/HomePage";
import { CURATION_BAKERY_LIST_PARAMS } from "@/components/domain/home/curationBakeryContentParams";
import { ensureBakeriesListLoaded } from "@/hooks/useBakeries";

export const Route = createFileRoute("/home")({
  /** 네비게이션 직후 자식 effect보다 앞서 목록 요청을 시작해 큐레이션 체감 로딩을 줄입니다. */
  loader: () => {
    void ensureBakeriesListLoaded(CURATION_BAKERY_LIST_PARAMS);
  },
  component: HomePage,
});
