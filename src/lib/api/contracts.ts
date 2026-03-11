import { z } from "zod";

export const apiErrorDetailsSchema = z.record(z.string(), z.array(z.string()));

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: apiErrorDetailsSchema.optional(),
});

export const apiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: apiErrorSchema,
  traceId: z.string().optional(),
});

export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;
export type ApiErrorDetails = z.infer<typeof apiErrorDetailsSchema>;

export type ApiErrorCode = string & {};

export type ApiSuccessEnvelope<TData> = {
  success: true;
  data: TData;
  traceId: string;
};

export type ApiEnvelope<TData> = ApiSuccessEnvelope<TData> | ApiErrorEnvelope;

export function createApiSuccessEnvelopeSchema<TDataSchema extends z.ZodTypeAny>(
  dataSchema: TDataSchema,
) {
  return z
    .object({
      success: z.literal(true),
      data: dataSchema,
      traceId: z.string(),
    })
    .passthrough();
}
