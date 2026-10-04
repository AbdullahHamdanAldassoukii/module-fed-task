import { parsePassportData, type PassportData } from '@repo/passport-contract';
import { z } from 'zod';

export interface IdInfo {
  idNumber: string;
  nationality: string;
}

export interface ApplicationPayload {
  passport: PassportData;
  idInfo: IdInfo;
}

export interface SubmitApplicationResult {
  referenceId: string;
  submittedAt: string;
}

const submitResultSchema = z.object({
  referenceId: z.string().min(1),
  submittedAt: z.string().min(1),
});

export function parseSubmitApplicationResponse(data: unknown): SubmitApplicationResult {
  const result = submitResultSchema.safeParse(data);
  if (!result.success) {
    throw new Error(
      result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
    );
  }
  return result.data;
}

export { parsePassportData };
