export type HelperPanelKey =
  | 'instructions'
  | 'sectionProgress'
  | 'generalProgress'
  | 'recommendation';

export interface HelperPanelVisibility {
  instructions: boolean;
  sectionProgress: boolean;
  generalProgress: boolean;
  recommendation: boolean;
}

export interface HelperPanelDockItem {
  key: HelperPanelKey;
  label: string;
  icon: string;
  visible: boolean;
}
