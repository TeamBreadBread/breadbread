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
