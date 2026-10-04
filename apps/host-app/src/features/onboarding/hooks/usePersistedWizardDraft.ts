import { useEffect, useRef } from 'react';
import { useServices } from '../../../hooks/useServices';
import type { KeyValueStorage } from '../../../lib/storage';
import {
  DRAFT_STORAGE_KEY,
  parsePersistedDraft,
  parseSubmittedReceipt,
  restoreWizardState,
  SUBMITTED_STORAGE_KEY,
  toPersistedDraft,
  toSubmittedReceipt,
  withoutDocument,
  type PersistedDraft,
} from '../model';
import { useOnboardingWizard, type OnboardingState } from './useOnboardingWizard';

export const DRAFT_WRITE_DELAY_MS = 300;

export function readPersistedWizard(storage: KeyValueStorage): OnboardingState {
  const draft = storage.get(DRAFT_STORAGE_KEY, parsePersistedDraft);
  const receipt = storage.get(SUBMITTED_STORAGE_KEY, parseSubmittedReceipt);
  return restoreWizardState(draft, receipt);
}

function writeDraft(storage: KeyValueStorage, draft: PersistedDraft) {
  if (storage.set(DRAFT_STORAGE_KEY, draft)) return;
  if (draft.passport.document !== null && storage.set(DRAFT_STORAGE_KEY, withoutDocument(draft))) {
    return;
  }
  storage.remove(DRAFT_STORAGE_KEY);
}

export function usePersistedWizardDraft() {
  const { sessionStorage } = useServices();
  const { state } = useOnboardingWizard();
  const pendingWrite = useRef<(() => void) | null>(null);

  useEffect(() => {
    const receipt = toSubmittedReceipt(state);
    if (receipt) {
      pendingWrite.current = null;
      sessionStorage.remove(DRAFT_STORAGE_KEY);
      sessionStorage.set(SUBMITTED_STORAGE_KEY, receipt);
      return undefined;
    }

    sessionStorage.remove(SUBMITTED_STORAGE_KEY);
    const draft = toPersistedDraft(state);
    if (!draft) {
      pendingWrite.current = null;
      sessionStorage.remove(DRAFT_STORAGE_KEY);
      return undefined;
    }

    const write = () => {
      pendingWrite.current = null;
      writeDraft(sessionStorage, draft);
    };
    pendingWrite.current = write;
    const timer = setTimeout(write, DRAFT_WRITE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [sessionStorage, state]);

  useEffect(() => {
    const flush = () => pendingWrite.current?.();
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);
}
