import type { PassportDraft, PassportFormState } from '@repo/passport-contract';
import { DateField, TextField } from '@repo/ui';
import { M, useT } from '../../../lib/i18n';
import { usePassportForm, type PassportFieldBinding } from '../hooks/usePassportForm';
import { DocumentField } from './DocumentField';
import { fieldErrorMessage } from './fieldErrorMessages';

export interface PassportFormFieldsProps {
  initialValue?: PassportDraft;
  onChange: (state: PassportFormState) => void;
}

export function PassportFormFields({ initialValue, onChange }: PassportFormFieldsProps) {
  const { t, language } = useT();
  const form = usePassportForm({ initialValue, onChange });
  const datePlaceholder = {
    year: t(M.fields.datePlaceholder.year),
    month: t(M.fields.datePlaceholder.month),
    day: t(M.fields.datePlaceholder.day),
  };
  const controlled = (field: PassportFieldBinding) => ({
    value: field.value,
    onChange: field.onChange,
    onBlur: field.onBlur,
    inputRef: field.inputRef,
    error: field.error ? t(fieldErrorMessage(field.error)) : undefined,
  });

  return (
    <section className="pf-card" aria-labelledby="pf-title" aria-describedby="pf-intro">
      <header className="pf-card-header">
        <h2 id="pf-title" className="pf-card-title">
          {t(M.form.title)}
        </h2>
        <p id="pf-intro" className="pf-card-intro">
          {t(M.form.intro)}
        </p>
      </header>
      <div className="pf-fields">
        <div className="pf-field-wide">
          <TextField
            id="pf-passport-number"
            name="passportNumber"
            label={t(M.fields.passportNumber)}
            autoComplete="off"
            required
            {...controlled(form.passportNumber)}
          />
        </div>
        <TextField
          id="pf-first-name"
          name="firstName"
          label={t(M.fields.firstName)}
          autoComplete="given-name"
          required
          {...controlled(form.firstName)}
        />
        <TextField
          id="pf-last-name"
          name="lastName"
          label={t(M.fields.lastName)}
          autoComplete="family-name"
          required
          {...controlled(form.lastName)}
        />
        <DateField
          id="pf-issue-date"
          name="issueDate"
          label={t(M.fields.issueDate)}
          locale={language}
          openCalendarLabel={t(M.fields.issueDateCalendar)}
          placeholder={datePlaceholder}
          required
          {...controlled(form.issueDate)}
        />
        <DateField
          id="pf-expiry-date"
          name="expiryDate"
          label={t(M.fields.expiryDate)}
          locale={language}
          openCalendarLabel={t(M.fields.expiryDateCalendar)}
          placeholder={datePlaceholder}
          min={form.earliestExpiryDate}
          required
          {...controlled(form.expiryDate)}
        />
        <div className="pf-field-wide">
          <DocumentField id="pf-document" field={form.document} />
        </div>
      </div>
    </section>
  );
}
