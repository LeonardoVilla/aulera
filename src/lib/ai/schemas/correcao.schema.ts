import { z } from "zod";

export const gradeResultSchema = z.object({
  score: z.number().min(0).max(10),
  feedback: z.string().min(10),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
});

export type GradeResult = z.infer<typeof gradeResultSchema>;
