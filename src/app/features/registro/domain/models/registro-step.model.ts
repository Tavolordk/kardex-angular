import { RegistroStepKey } from './registro.model';

export interface RegistroStep {
  key: RegistroStepKey;
  title: string;
  requiredCount: number;
  icon: string;
}

export interface SectionProgress {
  key: RegistroStepKey | 'reclutamiento' | 'certificacion';
  label: string;
  percentage: number;
}
