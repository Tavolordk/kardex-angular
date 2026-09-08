import { RegistroDraft } from '../models/registro.model';

export abstract class RegistroRepository {
  abstract loadDraft(): Promise<RegistroDraft | null>;
  abstract saveDraft(draft: RegistroDraft): Promise<void>;
  abstract clearDraft(): Promise<void>;
}
