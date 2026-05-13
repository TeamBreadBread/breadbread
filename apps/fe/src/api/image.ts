import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";

const PATH = "/images";

export type ImageFolder = "reviews";

export async function uploadImages(images: File[]): Promise<string[]> {
  const formData = new FormData();
  images.forEach((image) => {
    formData.append("images", image);
  });

  const { data } = await apiClient.post<ApiEnvelope<string[]>>(`${PATH}?folder=reviews`, formData);
  return extractData(data);
}
