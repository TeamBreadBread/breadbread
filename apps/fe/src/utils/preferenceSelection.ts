/** 질문 섹션 helper에 「중복 가능」이 있을 때만 다중 선택 (레거시) */
export function preferenceSectionAllowsMultiple(helperText?: string): boolean {
  return (helperText ?? "").includes("중복 가능");
}

export type PreferenceSectionMultipleRule = {
  allowMultiple?: boolean;
  helperText?: string;
};

/** `allowMultiple` 필드 우선; 없으면 helperText 레거시 규칙 */
export function sectionAllowsMultipleChoice(section: PreferenceSectionMultipleRule): boolean {
  if (typeof section.allowMultiple === "boolean") return section.allowMultiple;
  return preferenceSectionAllowsMultiple(section.helperText);
}
