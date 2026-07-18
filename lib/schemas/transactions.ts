import { z } from 'zod';

const EmailSchema = z.string().email().max(255);

export const EmailSubscriptionSchema = z.object({
  email: EmailSchema,
});

export type EmailSubscriptionInput = z.infer<typeof EmailSubscriptionSchema>;
