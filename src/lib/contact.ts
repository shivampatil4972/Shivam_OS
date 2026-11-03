import { z } from "zod";

/** Shared by the form (client) and the route handler (server). */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name (2+ characters).").max(80, "Name is too long."),
  email: z.string().trim().max(200).pipe(z.email("Please enter a valid email address.")),
  subject: z.string().trim().min(3, "Please add a subject (3+ characters).").max(120, "Subject is too long."),
  message: z.string().trim().min(20, "Please write at least 20 characters.").max(4000, "Message is too long (4,000 characters max)."),
  /** Honeypot: real visitors never see or fill this field. */
  company: z.string().max(0).optional().default(""),
  /** Milliseconds between the form rendering and submission. */
  elapsedMs: z.number().int().nonnegative().optional(),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;

export const MIN_FILL_MS = 2500;

export type ContactResponse =
  | { ok: true; delivered: true }
  | { ok: false; reason: "not-configured" | "invalid" | "rate-limited" | "spam" | "delivery-failed"; message: string; fieldErrors?: Record<string, string[]> };
