/** 질문 섹션 helper에 「중복 가능」이 있을 때만 다중 선택 */
export function preferenceSectionAllowsMultiple(helperText?: string): boolean {
  return (helperText ?? "").includes("중복 가능");
}
