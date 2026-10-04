import {
  parsePassportFormState,
  type PassportDraft,
  type PassportFormState,
} from '@repo/passport-contract';
import { RemoteContractError } from '../../lib/errors';
import type { Logger } from '../../lib/logger';

export function createStateGuard(logger: Logger) {
  let reported = false;

  return (raw: unknown, lastDraft: PassportDraft): PassportFormState => {
    const parsed = parsePassportFormState(raw);
    if (parsed.ok) return parsed.value;

    if (!reported) {
      reported = true;
      logger.error('remote.bad_state', {
        error: new RemoteContractError(`onChange payload rejected: ${parsed.issues.join('; ')}`),
      });
    }
    return { valid: false, data: lastDraft };
  };
}
