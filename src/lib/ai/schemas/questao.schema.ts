import { z } from "zod";

export const generatedObjectiveQuestionSchema = z.object({
  statement: z.string().min(10),
  options: z
    .array(
      z.object({
        id: z.enum(["A", "B", "C", "D"]),
        text: z.string().min(1),
      }),
    )
    .length(4),
  correctOptionId: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().min(1),
});

export const generatedObjectiveQuestionsSchema = z.array(
  generatedObjectiveQuestionSchema,
);

export type GeneratedObjectiveQuestion = z.infer<
  typeof generatedObjectiveQuestionSchema
>;

export const generatedDiscursiveQuestionSchema = z.object({
  statement: z.string().min(10),
  expectedTopics: z.array(z.string().min(1)).min(1),
  rubric: z.string().min(10),
});

export type GeneratedDiscursiveQuestion = z.infer<
  typeof generatedDiscursiveQuestionSchema
>;
