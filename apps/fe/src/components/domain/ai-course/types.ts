export interface PreferenceOption {
  id: string;
  label: string;
  selected?: boolean;
}

export interface PreferenceQuestion {
  id: string;
  title: string;
  allowMultiple?: boolean;
  options: PreferenceOption[];
}
