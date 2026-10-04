import { useEffect, useState } from 'react';
import {
  PASSPORT_FORM_CONTRACT_VERSION,
  type PassportFormModule,
  type PassportFormProps,
} from '@repo/passport-contract';

export function FakePassportForm({
  initialValue,
  onChange,
  locale,
  colorScheme,
  emit,
}: PassportFormProps & { emit?: (state: unknown) => unknown }) {
  const [firstName, setFirstName] = useState(initialValue?.firstName ?? '');
  const [crash, setCrash] = useState(false);

  if (crash) throw new Error('remote crashed');

  useEffect(() => {
    const state = {
      valid: false,
      data: {
        passportNumber: '',
        firstName,
        lastName: '',
        issueDate: '',
        expiryDate: '',
        document: null,
      },
    };
    onChange((emit ? emit(state) : state) as never);
  }, [emit, firstName, onChange]);

  return (
    <div data-locale={locale} data-scheme={colorScheme} data-testid="fake-remote">
      <label>
        First name{' '}
        <input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
      </label>
      <button type="button" onClick={() => setCrash(true)}>
        Crash
      </button>
    </div>
  );
}

export const fakeModule = (emit?: (state: unknown) => unknown): PassportFormModule => ({
  default: (props) => <FakePassportForm {...props} emit={emit} />,
  contractVersion: PASSPORT_FORM_CONTRACT_VERSION,
});
