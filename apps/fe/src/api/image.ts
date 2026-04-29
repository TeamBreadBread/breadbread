import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";

const PATH = "/api/images";

/** `UploadFolder` */
export type UploadFolder = "bakeries" | "breads" | "reviews" | "profiles";

export async function uploadImages(files: Blob[], folder: UploadFolder): Promise<string[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }
  formData.append("folder", folder);

  const { data } = await apiClient.post<ApiEnvelope<string[]>>(PATH, formData);
  return extractData(data);
}
