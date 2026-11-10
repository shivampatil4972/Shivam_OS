/** Server-side validation of Ask requests (zod stays out of the client bundle). */
import { z } from "zod";
import { ASK_MAX_HISTORY, ASK_MAX_HISTORY_ANSWER, ASK_MAX_QUESTION, ASK_MIN_QUESTION } from "./types";

// Control characters (except tab and newline) are stripped before validation.
const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f]/g;
const text = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(CONTROL, "").trim())
    .pipe(z.string().max(max, `Keep it under ${max} characters.`));

export const askRequestSchema = z
  .object({
    question: text(ASK_MAX_QUESTION).pipe(z.string().min(ASK_MIN_QUESTION, "Please type a question.")),
    history: z
      .array(z.object({ question: text(ASK_MAX_QUESTION), answer: text(ASK_MAX_HISTORY_ANSWER) }).strict())
      .max(ASK_MAX_HISTORY)
      .default([]),
  })
  .strict();

export type ParsedAskRequest = z.infer<typeof askRequestSchema>;
