import type { BakeryCorrectionField } from "@/lib/bakerySuggestStorage";

/** BE `BakeryUpdateField` */
export type BakeryUpdateFieldApi =
  | "ADDRESS"
  | "DISTRICT"
  | "REPRESENTATIVE_MENU"
  | "BUSINESS_HOURS"
  | "ETC";

export type SubmitNewBakeryReportRequest = {
  bakeryName: string;
  address?: string;
  district?: string;
  representativeMenus?: string[];
  recommendation?: string;
};

export type SubmitUpdateBakeryReportRequest = {
  targetBakeryName: string;
  updateField: BakeryUpdateFieldApi;
  correctValue: string;
  description?: string;
};

const CORRECTION_FIELD_TO_API: Record<BakeryCorrectionField, BakeryUpdateFieldApi> = {
  ADDRESS: "ADDRESS",
  DONG: "DISTRICT",
  MENU: "REPRESENTATIVE_MENU",
  HOURS: "BUSINESS_HOURS",
  OTHER: "ETC",
};

export function mapCorrectionFieldToApi(field: BakeryCorrectionField): BakeryUpdateFieldApi {
  return CORRECTION_FIELD_TO_API[field];
}

export function parseRepresentativeMenus(value: string): string[] {
  return value
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
