import { z } from 'zod';
import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js';

export const LANGS = ['ru', 'uk', 'en', 'es'] as const;
export const ROLE_OPTIONS = ['floor', 'coffee', 'front', 'beauty', 'other'] as const;
export const PROFESSION_OPTIONS = ['floor', 'coffee', 'front', 'beauty'] as const;

export type ErrorCode = 'required' | 'tooShort' | 'tooLong' | 'phone' | 'consent' | 'role';

const text = (min: number, max: number) =>
  z
    .string({ required_error: 'required' })
    .trim()
    .min(1, 'required')
    .min(min, 'tooShort')
    .max(max, 'tooLong');

export function normalizePhone(value: string) {
  const parsed = parsePhoneNumberFromString(value.trim(), 'ES');
  return parsed ? parsed.number : value.trim();
}

const phone = z
  .string({ required_error: 'required' })
  .trim()
  .min(1, 'required')
  .refine((v) => isValidPhoneNumber(v, 'ES'), 'phone')
  .transform(normalizePhone);

const consent = z.literal(true, { errorMap: () => ({ message: 'consent' }) });

const meta = {
  lang: z.enum(LANGS),
  utm_source: z.string().max(200).optional().default(''),
  utm_medium: z.string().max(200).optional().default(''),
  utm_campaign: z.string().max(200).optional().default(''),
  utm_content: z.string().max(200).optional().default(''),
  referrer: z.string().max(500).optional().default(''),
  page_url: z.string().max(500).optional().default(''),
  timestamp: z.string().max(40).optional().default(''),
  company_site: z.string().max(0).optional().default(''),
  turnstile_token: z.string().max(4096).optional().default(''),
};

export const businessFields = z.object({
  name: text(2, 60),
  business: text(2, 80),
  role: z.enum(ROLE_OPTIONS, { errorMap: () => ({ message: 'role' }) }),
  whatsapp: phone,
  consent,
});

export const candidateFields = z.object({
  name: text(2, 60),
  whatsapp: phone,
  profession: z.enum(PROFESSION_OPTIONS, { errorMap: () => ({ message: 'role' }) }),
  consent,
});

export const leadSchema = z.discriminatedUnion('type', [
  businessFields.extend({ type: z.literal('business'), ...meta }),
  candidateFields.extend({ type: z.literal('candidate'), ...meta }),
]);

export type Lead = z.infer<typeof leadSchema>;
export type BusinessFields = z.input<typeof businessFields>;
export type CandidateFields = z.input<typeof candidateFields>;

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, ErrorCode> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !out[key]) out[key] = issue.message as ErrorCode;
  }
  return out;
}
