export interface CoursePlace {
  id: string;
  name: string;
  address: string;
  menu: string;
}

export interface CourseSummary {
  title: string;
  duration: string;
  price: string;
}

export interface PreferenceOption {
  id: string;
  label: string;
  selected?: boolean;
}

export interface PreferenceQuestion {
  id: string;
  title: string;
  allowMultiple?: boolean;
  hideSelectionHint?: boolean;
  options: PreferenceOption[];
}
