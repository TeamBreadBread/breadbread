import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";

const PATH = "/images";

/** `GET /images` 선업로드 쿼리 `folder` — 백엔드 `UploadFolder`와 동일 */
export type ImageFolder = "reviews" | "posts";

export async function uploadImages(
  images: File[],
  folder: ImageFolder = "reviews",
): Promise<string[]> {
  const formData = new FormData();
  images.forEach((image) => {
    formData.append("images", image);
  });

  const { data } = await apiClient.post<ApiEnvelope<string[]>>(
    `${PATH}?folder=${encodeURIComponent(folder)}`,
    formData,
  );
  return extractData(data);
}
